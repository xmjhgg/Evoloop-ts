package com.evoloop.cloud.modules.identity.api;

import com.evoloop.cloud.http.ProtocolValidator;
import com.evoloop.cloud.modules.identity.application.DeactivateAccount;
import com.evoloop.cloud.modules.identity.model.Account;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/identity/account")
public class AccountAccessController {
  private final DeactivateAccount deactivate;
  private final ProtocolValidator validator;
  public AccountAccessController(DeactivateAccount deactivate, ProtocolValidator validator) { this.deactivate = deactivate; this.validator = validator; }
  @PostMapping("/deactivate") public Object deactivate(@RequestAttribute Account account, @RequestBody JsonNode input) {
    validator.validate("Deactivate", input);
    deactivate.execute(account.id(), input.get("expectedPurposeVersion").asText());
    return Map.of("status", "DISABLED", "dataRetained", true);
  }
}
