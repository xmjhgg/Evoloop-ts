package com.evoloop.cloud.modules.ai.api;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.http.ProtocolValidator;
import com.evoloop.cloud.infrastructure.mysql.BlobStorage;
import com.evoloop.cloud.modules.identity.model.Account;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/ai/assets")
public class AiAssetsController {
  private final BlobStorage blobs;
  private final ProtocolValidator validator;
  public AiAssetsController(BlobStorage blobs, ProtocolValidator validator) { this.blobs = blobs; this.validator = validator; }
  @PostMapping public Object upload(@RequestAttribute Account account, @RequestBody JsonNode input) {
    CloudError.check(account.aiAllowed() && account.healthAllowed(), 403, "PURPOSE_REQUIRED");
    validator.validate("Asset", input);
    return blobs.store(account.id(), "AI", input);
  }
}
