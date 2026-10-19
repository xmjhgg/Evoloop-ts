package com.evoloop.cloud.http;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class ProtocolValidator {
  private final Map<String, JsonNode> schemas = new HashMap<>();
  public ProtocolValidator() throws Exception {
    JsonNode index;
    try (var input = new ClassPathResource("protocol/index.json").getInputStream()) { index = Canonical.JSON.readTree(input); }
    for (JsonNode entry : index.get("schemas")) {
      String name = entry.asText();
      try (var input = new ClassPathResource("protocol/" + name + ".json").getInputStream()) {
        schemas.put(name, Canonical.JSON.readTree(input));
      }
    }
  }
  public void validate(String name, JsonNode input) {
    CloudError.check(Canonical.text(input).getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 8 * 1024 * 1024, 413, "INPUT_TOO_LARGE");
    CloudError.check(matches(schemas.get(name), input), 422, "VALIDATION_FAILED");
  }
  private boolean matches(JsonNode schema, JsonNode value) {
    if (schema.has("anyOf")) {
      boolean matched = false;
      for (JsonNode option : schema.get("anyOf")) if (matches(option, value)) matched = true;
      if (!matched) return false;
    }
    if (schema.has("const") && !schema.get("const").equals(value)) return false;
    if (schema.has("enum")) {
      boolean found = false;
      for (JsonNode option : schema.get("enum")) if (option.equals(value)) found = true;
      if (!found) return false;
    }
    if (!schema.has("type")) return true;
    return switch (schema.get("type").asText()) {
      case "null" -> value.isNull();
      case "boolean" -> value.isBoolean();
      case "string" -> stringMatches(schema, value);
      case "array" -> arrayMatches(schema, value);
      case "object" -> objectMatches(schema, value);
      default -> throw new IllegalStateException("Unsupported protocol schema type");
    };
  }
  private boolean stringMatches(JsonNode schema, JsonNode value) {
    if (!value.isTextual()) return false;
    String text = value.asText();
    int length = text.codePointCount(0, text.length());
    if (length < schema.path("minLength").asInt(0) || length > schema.path("maxLength").asInt(Integer.MAX_VALUE)) return false;
    if (schema.has("pattern") && !Pattern.compile(schema.get("pattern").asText()).matcher(text).find()) return false;
    if (schema.path("format").asText().equals("uuid")) {
      try { if (!UUID.fromString(text).toString().equals(text.toLowerCase(java.util.Locale.ROOT))) return false; }
      catch (IllegalArgumentException error) { return false; }
    }
    return true;
  }
  private boolean arrayMatches(JsonNode schema, JsonNode value) {
    if (!value.isArray() || value.size() < schema.path("minItems").asInt(0) || value.size() > schema.path("maxItems").asInt(Integer.MAX_VALUE)) return false;
    for (JsonNode item : value) if (!matches(schema.get("items"), item)) return false;
    return true;
  }
  private boolean objectMatches(JsonNode schema, JsonNode value) {
    if (!value.isObject()) return false;
    for (JsonNode required : schema.path("required")) if (!value.has(required.asText())) return false;
    var fields = value.fields();
    while (fields.hasNext()) {
      var field = fields.next();
      if (schema.has("propertyNames") && !matches(schema.get("propertyNames"), Canonical.JSON.getNodeFactory().textNode(field.getKey()))) return false;
      JsonNode property = schema.path("properties").get(field.getKey());
      if (property == null) {
        JsonNode additional = schema.get("additionalProperties");
        if (additional != null && additional.isBoolean() && !additional.asBoolean()) return false;
        if (additional != null && additional.isObject() && !matches(additional, field.getValue())) return false;
      }
      else if (!matches(property, field.getValue())) return false;
    }
    return true;
  }
}
