package com.evoloop.cloud.modules.ai.application;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.http.ProtocolValidator;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.ai.ports.ModelProvider;
import com.evoloop.cloud.modules.identity.application.Sessions;
import com.evoloop.cloud.infrastructure.mysql.BlobStorage;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.Map;
import java.util.UUID;

@Service
public class SubmitTask {
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  private final Sessions sessions;
  private final ProtocolValidator validator;
  private final ModelProvider provider;
  private final BlobStorage blobs;
  public SubmitTask(JdbcTemplate sql, TransactionTemplate transactions, Sessions sessions, ProtocolValidator validator, ModelProvider provider, BlobStorage blobs) {
    this.sql = sql; this.transactions = transactions; this.sessions = sessions; this.validator = validator; this.provider = provider; this.blobs = blobs;
  }
  public Object execute(String accountId, JsonNode input) {
    validator.validate("AiRequest", input);
    CloudError.check(Canonical.hash(input.get("input").asText()).equals(input.get("inputDigest").asText()), 422, "DIGEST_MISMATCH");
    CloudError.check(Canonical.text(Canonical.parse(input.get("input").asText())).equals(input.get("input").asText()), 422, "NONCANONICAL_DATA");
    String digest = Canonical.hash(Canonical.text(input));
    return transactions.execute(status -> {
      var account = sessions.lockCurrent(accountId);
      CloudError.check(account.aiAllowed(), 403, "PURPOSE_REQUIRED");
      if (input.has("assetIds")) for (JsonNode assetId : input.get("assetIds")) {
        CloudError.check(account.healthAllowed(), 403, "PURPOSE_REQUIRED");
        blobs.read(accountId, "AI", assetId.asText());
      }
      var previous = sql.queryForList("SELECT task_id,request_digest,status FROM ai_task WHERE account_id=? AND client_request_id=?", accountId, input.get("clientRequestId").asText());
      if (!previous.isEmpty()) {
        CloudError.check(digest.equals(previous.getFirst().get("request_digest")), 409, "AI_REQUEST_ID_REUSED");
        return Map.of("taskId", previous.getFirst().get("task_id"), "status", previous.getFirst().get("status"), "inputDigest", input.get("inputDigest").asText());
      }
      CloudError.check(provider.available(), 503, "AI_UNAVAILABLE");
      Long pending = sql.queryForObject("SELECT COUNT(*) FROM ai_task WHERE account_id=? AND status IN ('QUEUED','RUNNING')", Long.class, accountId);
      CloudError.check(pending < 5, 429, "RATE_LIMITED");
      String id = UUID.randomUUID().toString();
      var frozen = ((com.fasterxml.jackson.databind.node.ObjectNode) input).deepCopy();
      frozen.put("providerModel", provider.modelId()); frozen.put("promptVersion", "candidate-proxy-v1");
      sql.update("INSERT INTO ai_task(account_id,task_id,client_request_id,request_digest,input_digest,request_json,status,purpose_version) VALUES(?,?,?,?,?,?,'QUEUED',?)", accountId, id, input.get("clientRequestId").asText(), digest, input.get("inputDigest").asText(), Canonical.text(frozen), account.purposeVersion());
      return Map.of("taskId", id, "status", "QUEUED", "inputDigest", input.get("inputDigest").asText());
    });
  }
}
