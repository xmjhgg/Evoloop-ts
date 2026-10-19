package com.evoloop.cloud;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {"evoloop.purpose-notice-version=synthetic-test-only", "evoloop.purpose-notice-text=Synthetic notice for tests only", "evoloop.ai.poll-ms=3600000", "evoloop.identity.registration-limit=200"})
@ContextConfiguration(initializers = TestDatabaseGuard.class)
abstract class CloudTestSupport {
  @LocalServerPort int port;
  @Autowired JdbcTemplate sql;
  final HttpClient client = HttpClient.newHttpClient();
  record Response(int status, JsonNode body) {}
  record Login(String accountId, String token) {}
  @BeforeAll static void isolatedDatabaseRequired() {
    assertTrue(System.getenv().getOrDefault("EVOLOOP_CLOUD_DB_URL", "").matches("jdbc:mysql://[^/]+/evoloop_two_test(?:\\?.*)?"), "Real isolated MySQL required; these tests never skip");
  }
  Response request(String method, String path, String token, Object body) throws Exception {
    var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path));
    if (token != null) builder.header("Authorization", "Bearer " + token);
    if (body != null) builder.header("Content-Type", "application/json");
    String json = body == null ? "" : Canonical.JSON.writeValueAsString(body);
    var response = client.send(builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json)).build(), HttpResponse.BodyHandlers.ofString());
    return new Response(response.statusCode(), response.body().isBlank() ? Canonical.JSON.nullNode() : Canonical.parse(response.body()));
  }
  Login account() throws Exception {
    String username = "u_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
    var registered = request("POST", "/api/v2/identity/accounts", null, Map.of("username", username, "password", "test-only-long-password!", "declarationVersion", "registration-v1"));
    assertEquals(201, registered.status(), registered.body().toString());
    var login = request("POST", "/api/v2/identity/sessions/password", null, Map.of("username", username, "password", "test-only-long-password!", "device", "integration test"));
    assertEquals(201, login.status(), login.body().toString());
    return new Login(registered.body().get("accountId").asText(), login.body().get("credential").asText());
  }
  JsonNode batch(String accountId, String expectedHead) {
    var body = Canonical.JSON.createObjectNode();
    body.put("protocolVersion", "1"); body.put("batchId", UUID.randomUUID().toString()); body.put("deviceId", UUID.randomUUID().toString());
    body.put("expectedHeadVersion", expectedHead); body.put("payloadSchemaVersion", "documents-v1");
    var after = Canonical.JSON.createObjectNode();
    after.put("accountId", accountId); after.put("id", UUID.randomUUID().toString()); after.put("version", "1"); after.put("revisionId", UUID.randomUUID().toString());
    after.put("data", "{\"amount\":\"900719925474099312345.125\",\"unknown\":null}");
    var change = Canonical.JSON.createObjectNode();
    change.put("table", "execution.fact"); change.put("id", after.get("id").asText()); change.putNull("before"); change.set("after", after);
    body.putArray("changes").add(change);
    body.put("payloadDigest", Canonical.hash(Canonical.text(body)));
    return body;
  }
}
