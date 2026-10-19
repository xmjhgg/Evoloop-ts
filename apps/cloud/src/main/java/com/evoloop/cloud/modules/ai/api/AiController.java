package com.evoloop.cloud.modules.ai.api;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.ai.application.SubmitTask;
import com.evoloop.cloud.modules.identity.model.Account;
import com.evoloop.cloud.modules.identity.application.Sessions;
import com.evoloop.cloud.modules.identity.application.RateLimits;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/v2/ai/tasks")
public class AiController {
  private final SubmitTask submit;
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  private final Sessions sessions;
  private final RateLimits limits;
  public AiController(SubmitTask submit, JdbcTemplate sql, TransactionTemplate transactions, Sessions sessions, RateLimits limits) {
    this.submit = submit; this.sql = sql; this.transactions = transactions; this.sessions = sessions; this.limits = limits;
  }
  @PostMapping @ResponseStatus(HttpStatus.ACCEPTED)
  public Object submit(@RequestAttribute Account account, @RequestBody JsonNode input) {
    limits.check("ai:" + account.id(), 20);
    return submit.execute(account.id(), input);
  }
  @GetMapping("/{id}")
  public Object read(@RequestAttribute Account account, @PathVariable String id) {
    var rows = sql.queryForList("SELECT * FROM ai_task WHERE account_id=? AND task_id=?", account.id(), id);
    CloudError.check(!rows.isEmpty(), 404, "TASK_NOT_FOUND");
    var task = rows.getFirst();
    var response = new LinkedHashMap<String, Object>();
    response.put("taskId", id); response.put("status", task.get("status")); response.put("version", task.get("version").toString());
    response.put("inputDigest", task.get("input_digest")); response.put("errorCode", task.get("error_code"));
    boolean authorized = account.aiAllowed() && Long.parseLong(task.get("purpose_version").toString()) == account.purposeVersion();
    response.put("output", authorized && task.get("output_json") != null ? Canonical.parse((String) task.get("output_json")) : null);
    response.put("sourceMetadata", authorized ? Canonical.parse((String) task.get("request_json")).get("sourceMetadata").asText() : "");
    response.put("outputSchemaVersion", "candidate-v1");
    var frozen = Canonical.parse((String) task.get("request_json"));
    response.put("modelId", frozen.path("providerModel").asText()); response.put("promptVersion", frozen.path("promptVersion").asText());
    return response;
  }
  @DeleteMapping("/{id}")
  public Object cancel(@RequestAttribute Account account, @PathVariable String id, @RequestParam String expectedVersion) {
    CloudError.check(expectedVersion.matches("[1-9]\\d{0,17}"), 422, "VALIDATION_FAILED");
    return transactions.execute(status -> {
      sessions.lockCurrent(account.id());
      var rows = sql.queryForList("SELECT status,version FROM ai_task WHERE account_id=? AND task_id=? FOR UPDATE", account.id(), id);
      CloudError.check(!rows.isEmpty(), 404, "TASK_NOT_FOUND");
      if ("CANCELLED".equals(rows.getFirst().get("status"))) return java.util.Map.of("status", "CANCELLED");
      CloudError.check(rows.getFirst().get("version").toString().equals(expectedVersion), 409, "VERSION_CONFLICT");
      sql.update("UPDATE ai_task SET status='CANCELLED',version=version+1,output_json=NULL,lease_token=NULL WHERE account_id=? AND task_id=?", account.id(), id);
      return java.util.Map.of("status", "CANCELLED");
    });
  }
}
