package com.evoloop.cloud.modules.sync.api;

import com.evoloop.cloud.http.ProtocolValidator;
import com.evoloop.cloud.infrastructure.mysql.BlobStorage;
import com.evoloop.cloud.modules.identity.model.Account;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/sync/attachments")
public class AttachmentsController {
  private final BlobStorage blobs;
  private final ProtocolValidator validator;
  public AttachmentsController(BlobStorage blobs, ProtocolValidator validator) { this.blobs = blobs; this.validator = validator; }
  @PostMapping public Object upload(@RequestAttribute Account account, @RequestBody JsonNode input) {
    validator.validate("Asset", input);
    return blobs.store(account.id(), "SYNC", input);
  }
  @GetMapping("/{id}") public Object read(@RequestAttribute Account account, @PathVariable String id) { return blobs.read(account.id(), "SYNC", id); }
}
