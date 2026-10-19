package com.evoloop.cloud.modules.identity.api;

import com.evoloop.cloud.generated.Wire;
import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.http.ProtocolValidator;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.identity.application.*;
import com.evoloop.cloud.modules.identity.model.Account;
import com.evoloop.cloud.modules.identity.model.PurposeChanged;
import org.springframework.context.ApplicationEventPublisher;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/identity")
public class IdentityController {
  private final RegisterAccount register;
  private final PasswordLogin login;
  private final Sessions sessions;
  private final ProtocolValidator validator;
  private final RateLimits limits;
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  private final PurposeNotice notice;
  private final int registrationLimit;
  private final ApplicationEventPublisher events;
  public IdentityController(RegisterAccount register, PasswordLogin login, Sessions sessions, ProtocolValidator validator, RateLimits limits, JdbcTemplate sql, TransactionTemplate transactions, PurposeNotice notice, @Value("${evoloop.identity.registration-limit:10}") int registrationLimit, ApplicationEventPublisher events) {
    this.register = register; this.login = login; this.sessions = sessions; this.validator = validator;
    this.limits = limits; this.sql = sql; this.transactions = transactions; this.notice = notice; this.registrationLimit = registrationLimit;
    this.events = events;
  }
  @PostMapping("/accounts") @ResponseStatus(HttpStatus.CREATED)
  public Object register(@RequestBody JsonNode input, HttpServletRequest request) throws Exception {
    limits.check("register:" + request.getRemoteAddr(), registrationLimit);
    validator.validate("Registration", input);
    return register.execute(Canonical.JSON.treeToValue(input, Wire.Registration.class));
  }
  @PostMapping("/sessions/password") @ResponseStatus(HttpStatus.CREATED)
  public Object login(@RequestBody JsonNode input, HttpServletRequest request) throws Exception {
    limits.check("login:" + request.getRemoteAddr(), 30);
    validator.validate("Login", input);
    return login.execute(Canonical.JSON.treeToValue(input, Wire.Login.class));
  }
  @GetMapping("/session")
  public Object current(@RequestAttribute Account account) {
    return Map.of("accountId", account.id(), "username", account.username(), "aiAllowed", account.aiAllowed(), "healthAllowed", account.healthAllowed(), "purposeVersion", Long.toString(account.purposeVersion()));
  }
  @DeleteMapping("/session") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void revoke(@RequestAttribute String credential) { sessions.revoke(credential); }
  @PutMapping("/purposes")
  public Object purposes(@RequestAttribute Account account, @RequestBody JsonNode input) {
    validator.validate("Purpose", input);
    transactions.executeWithoutResult(status -> {
      Account current = sessions.lockCurrent(account.id());
      CloudError.check(Long.toString(current.purposeVersion()).equals(input.get("expectedPurposeVersion").asText()), 409, "PURPOSE_VERSION_CONFLICT");
      boolean newGrant = input.get("aiAllowed").asBoolean() && !current.aiAllowed() || input.get("healthAllowed").asBoolean() && !current.healthAllowed();
      if (newGrant) notice.verify(input.get("noticeVersion").asText());
      sql.update("UPDATE cloud_account SET ai_allowed=?,health_allowed=?,purpose_version=purpose_version+1 WHERE account_id=?", input.get("aiAllowed").asBoolean(), input.get("healthAllowed").asBoolean(), account.id());
      events.publishEvent(new PurposeChanged(account.id()));
    });
    return Map.of("updated", true, "noticeVersion", notice.version());
  }
}
