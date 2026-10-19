package com.evoloop.cloud.modules.ai.infrastructure;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.ai.ports.ModelProvider;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.List;

@Component
public class HttpsModelProvider implements ModelProvider {
  private final String endpoint;
  private final String apiKey;
  private final String model;
  private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();
  public HttpsModelProvider(@Value("${evoloop.ai.endpoint}") String endpoint, @Value("${evoloop.ai.api-key}") String apiKey, @Value("${evoloop.ai.model}") String model) {
    this.endpoint = endpoint; this.apiKey = apiKey; this.model = model;
  }
  @Override public boolean available() { return endpoint.startsWith("https://") && !apiKey.isBlank() && !model.isBlank(); }
  @Override public String modelId() { return model; }
  @Override public JsonNode generate(JsonNode frozenRequest) {
    CloudError.check(available(), 503, "AI_UNAVAILABLE");
    try {
      var content = new java.util.ArrayList<Object>();
      content.add(Map.of("type", "text", "text", Canonical.JSON.writeValueAsString(Map.of("capability", frozenRequest.path("capability").asText(), "sourceMetadata", frozenRequest.path("sourceMetadata").asText(), "input", frozenRequest.get("input").asText()))));
      for (JsonNode image : frozenRequest.path("assetContents")) content.add(Map.of("type", "image_url", "image_url", Map.of("url", "data:" + image.get("mediaType").asText() + ";base64," + image.get("dataBase64").asText())));
      String body = Canonical.JSON.writeValueAsString(Map.of("model", model, "response_format", Map.of("type", "json_object"), "messages", List.of(
        Map.of("role", "system", "content", "Return a JSON candidate object with text (string) and data (object or null). Represent all numbers as decimal strings and unknown values as null. Provide candidates only; never claim a plan, intake or review is confirmed."),
        Map.of("role", "user", "content", content))));
      HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint)).timeout(Duration.ofSeconds(60)).header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
      HttpResponse<java.io.InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
      try (var stream = response.body()) {
        CloudError.check(response.statusCode() >= 200 && response.statusCode() < 300, 503, "AI_UNAVAILABLE");
        byte[] bytes = stream.readNBytes(1048577);
        CloudError.check(bytes.length <= 1048576, 422, "INVALID_OUTPUT");
        JsonNode output = Canonical.parse(new String(bytes, java.nio.charset.StandardCharsets.UTF_8));
        String generatedContent = output.path("choices").path(0).path("message").path("content").asText();
        JsonNode candidate = Canonical.parse(generatedContent);
        CloudError.check(candidate.isObject() && candidate.path("text").isTextual() && candidate.has("data") && (candidate.get("data").isNull() || candidate.get("data").isObject()), 422, "INVALID_OUTPUT");
        Canonical.text(candidate);
        return candidate;
      }
    } catch (CloudError error) { throw error; }
    catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new CloudError(503, "AI_UNAVAILABLE"); }
    catch (Exception error) { throw new CloudError(503, "AI_UNAVAILABLE"); }
  }
}
