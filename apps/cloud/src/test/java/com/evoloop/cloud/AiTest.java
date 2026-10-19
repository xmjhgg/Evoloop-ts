package com.evoloop.cloud;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.ai.ports.ModelProvider;
import com.evoloop.cloud.modules.ai.workers.TaskWorker;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;

@Import(AiTest.Providers.class)
class AiTest extends CloudTestSupport {
  @TestConfiguration static class Providers {
    @Bean @Primary TestProvider testProvider() { return new TestProvider(); }
  }
  static class TestProvider implements ModelProvider {
    boolean available = true;
    CountDownLatch entered;
    CountDownLatch release;
    public boolean available() { return available; }
    public String modelId() { return "synthetic-test-only"; }
    public JsonNode generate(JsonNode request) {
      if (entered != null) {
        entered.countDown();
        try { assertTrue(release.await(5, TimeUnit.SECONDS)); } catch (InterruptedException error) { throw new RuntimeException(error); }
      }
      return Canonical.parse("{\"text\":\"synthetic candidate\",\"data\":null}");
    }
  }
  @Autowired TestProvider provider;
  @Autowired TaskWorker worker;
  JsonNode input() {
    String input = "{\"quantity\":\"1.25\",\"unknown\":null}";
    return Canonical.JSON.valueToTree(Map.of("clientRequestId", UUID.randomUUID().toString(), "capability", "REVIEW", "input", input,
      "inputDigest", Canonical.hash(input), "sourceMetadata", "{\"scope\":\"client-only\"}", "outputSchemaVersion", "candidate-v1"));
  }
  void allow(Login account) throws Exception {
    assertEquals(200, request("PUT", "/api/v2/identity/purposes", account.token(), Map.of("aiAllowed", true, "healthAllowed", false, "noticeVersion", "synthetic-test-only", "expectedPurposeVersion", "0")).status());
  }
  @Test void providerResultRemainsAnUnconfirmedCandidateAndRequestIsIdempotent() throws Exception {
    Login account = account();
    JsonNode input = input();
    assertEquals(403, request("POST", "/api/v2/ai/tasks", account.token(), input).status());
    allow(account);
    var submitted = request("POST", "/api/v2/ai/tasks", account.token(), input);
    assertEquals(202, submitted.status(), submitted.body().toString());
    String taskId = submitted.body().get("taskId").asText();
    worker.run(account.accountId(), taskId);
    var result = request("GET", "/api/v2/ai/tasks/" + taskId, account.token(), null);
    assertEquals("SUCCEEDED", result.body().get("status").asText());
    assertEquals("synthetic candidate", result.body().get("output").get("text").asText());
    assertEquals(taskId, request("POST", "/api/v2/ai/tasks", account.token(), input).body().get("taskId").asText());
    Login other = account();
    assertEquals(404, request("GET", "/api/v2/ai/tasks/" + taskId, other.token(), null).status());
  }
  @Test void cancelledInFlightTaskCannotBeResurrectedByLateProviderResult() throws Exception {
    Login account = account(); allow(account);
    String id = request("POST", "/api/v2/ai/tasks", account.token(), input()).body().get("taskId").asText();
    provider.entered = new CountDownLatch(1); provider.release = new CountDownLatch(1);
    try (var executor = Executors.newSingleThreadExecutor()) {
      var job = executor.submit(() -> worker.run(account.accountId(), id));
      assertTrue(provider.entered.await(5, TimeUnit.SECONDS));
      String version = request("GET", "/api/v2/ai/tasks/" + id, account.token(), null).body().get("version").asText();
      assertEquals(200, request("DELETE", "/api/v2/ai/tasks/" + id + "?expectedVersion=" + version, account.token(), null).status());
      provider.release.countDown(); job.get();
    } finally { provider.entered = null; provider.release = null; }
    var result = request("GET", "/api/v2/ai/tasks/" + id, account.token(), null);
    assertEquals("CANCELLED", result.body().get("status").asText());
    assertTrue(result.body().get("output").isNull());
  }
  @Test void unavailableProviderFailsWithoutMockFallback() throws Exception {
    Login account = account(); allow(account);
    String queued = request("POST", "/api/v2/ai/tasks", account.token(), input()).body().get("taskId").asText();
    provider.available = false;
    try {
      assertEquals("AI_UNAVAILABLE", request("POST", "/api/v2/ai/tasks", account.token(), input()).body().get("code").asText());
      worker.poll();
      var failed = request("GET", "/api/v2/ai/tasks/" + queued, account.token(), null);
      assertEquals("FAILED", failed.body().get("status").asText());
      assertEquals("AI_UNAVAILABLE", failed.body().get("errorCode").asText());
    }
    finally { provider.available = true; }
  }
}
