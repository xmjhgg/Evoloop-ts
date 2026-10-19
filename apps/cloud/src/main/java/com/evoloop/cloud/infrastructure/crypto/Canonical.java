package com.evoloop.cloud.infrastructure.crypto;

import com.evoloop.cloud.http.CloudError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;

public final class Canonical {
  public static final ObjectMapper JSON = new ObjectMapper().enable(com.fasterxml.jackson.core.JsonParser.Feature.STRICT_DUPLICATE_DETECTION)
    .enable(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_TRAILING_TOKENS);
  private Canonical() {}
  public static String text(JsonNode node) {
    if (node.isNull() || node.isBoolean()) return node.toString();
    if (node.isTextual()) {
      String value = node.textValue();
      for (int index = 0; index < value.length(); index++) {
        char character = value.charAt(index);
        if (Character.isHighSurrogate(character)) {
          CloudError.check(index + 1 < value.length() && Character.isLowSurrogate(value.charAt(++index)), 422, "INVALID_UNICODE");
        } else CloudError.check(!Character.isLowSurrogate(character), 422, "INVALID_UNICODE");
      }
      try { return JSON.writeValueAsString(value); } catch (Exception error) { throw new CloudError(422, "PAYLOAD_INVALID"); }
    }
    if (node.isArray()) {
      var parts = new ArrayList<String>();
      node.forEach(child -> parts.add(text(child)));
      return "[" + String.join(",", parts) + "]";
    }
    CloudError.check(node.isObject(), 422, "CANONICAL_VALUE_INVALID");
    var names = new ArrayList<String>();
    node.fieldNames().forEachRemaining(names::add);
    Collections.sort(names);
    var parts = new ArrayList<String>();
    for (String name : names) parts.add(text(JSON.getNodeFactory().textNode(name)) + ":" + text(node.get(name)));
    return "{" + String.join(",", parts) + "}";
  }
  public static String hash(String text) {
    try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8))); }
    catch (Exception error) { throw new IllegalStateException(error); }
  }
  public static JsonNode parse(String value) {
    try {
      JsonNode node = JSON.readTree(value);
      CloudError.check(node != null, 422, "PAYLOAD_INVALID");
      return node;
    }
    catch (Exception error) { throw new CloudError(422, "PAYLOAD_INVALID"); }
  }
}
