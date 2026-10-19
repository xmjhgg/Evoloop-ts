package com.evoloop.cloud.modules.ai.ports;

import com.fasterxml.jackson.databind.JsonNode;

public interface ModelProvider {
  JsonNode generate(JsonNode frozenRequest);
  boolean available();
  String modelId();
}
