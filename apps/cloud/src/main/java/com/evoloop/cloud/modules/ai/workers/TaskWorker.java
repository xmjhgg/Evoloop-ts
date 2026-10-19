package com.evoloop.cloud.modules.ai.workers;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.ai.ports.ModelProvider;
import com.evoloop.cloud.infrastructure.mysql.BlobStorage;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.Map;
import java.util.UUID;

@Component
public class TaskWorker {
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  private final ModelProvider provider;
  private final BlobStorage blobs;
  public TaskWorker(JdbcTemplate sql, TransactionTemplate transactions, ModelProvider provider, BlobStorage blobs) { this.sql = sql; this.transactions = transactions; this.provider = provider; this.blobs = blobs; }
  @Scheduled(fixedDelayString = "${evoloop.ai.poll-ms:1000}")
  public void poll() {
    // An expired in-flight call is failed explicitly; automatic retry could bill twice.
    sql.update("UPDATE ai_task SET status='FAILED',version=version+1,error_code='LEASE_EXPIRED' WHERE status='RUNNING' AND lease_until<CURRENT_TIMESTAMP(3)");
    if (!provider.available()) {
      sql.update("UPDATE ai_task SET status='FAILED',version=version+1,error_code='AI_UNAVAILABLE' WHERE status='QUEUED'");
      return;
    }
    var queued = sql.queryForList("SELECT account_id,task_id FROM ai_task WHERE status='QUEUED' ORDER BY created_at LIMIT 1");
    if (!queued.isEmpty()) run((String) queued.getFirst().get("account_id"), (String) queued.getFirst().get("task_id"));
  }
  public void run(String accountId, String taskId) {
    String lease = UUID.randomUUID().toString();
    Map<String, Object> task = transactions.execute(status -> {
      var accounts = sql.queryForList("SELECT purpose_version FROM cloud_account WHERE account_id=? AND status='ACTIVE' AND ai_allowed=TRUE FOR UPDATE", accountId);
      if (accounts.isEmpty()) return null;
      int claimed = sql.update("UPDATE ai_task SET status='RUNNING',version=version+1,lease_token=?,lease_until=TIMESTAMPADD(SECOND,120,CURRENT_TIMESTAMP(3)) WHERE account_id=? AND task_id=? AND status='QUEUED' AND purpose_version=?", lease, accountId, taskId, accounts.getFirst().get("purpose_version"));
      if (claimed != 1) return null;
      return sql.queryForMap("SELECT request_json,purpose_version FROM ai_task WHERE account_id=? AND task_id=?", accountId, taskId);
    });
    if (task == null) return;
    String result = null, failure = null;
    try {
      ObjectNode request = (ObjectNode) Canonical.parse((String) task.get("request_json"));
      CloudError.check(request.get("providerModel").asText().equals(provider.modelId()), 409, "MODEL_VERSION_CHANGED");
      var images = request.putArray("assetContents");
      if (request.has("assetIds")) for (var assetId : request.get("assetIds")) images.add(blobs.read(accountId, "AI", assetId.asText()));
      result = Canonical.text(provider.generate(request));
    }
    catch (CloudError error) { failure = error.code; }
    catch (Exception error) { failure = "AI_UNAVAILABLE"; }
    final String output = result, code = failure;
    transactions.executeWithoutResult(status -> {
      var active = sql.queryForList("SELECT account_id FROM cloud_account WHERE account_id=? AND status='ACTIVE' AND ai_allowed=TRUE AND purpose_version=? FOR UPDATE", accountId, task.get("purpose_version"));
      if (active.isEmpty()) return;
      sql.update("UPDATE ai_task SET status=?,version=version+1,output_json=?,error_code=?,lease_token=NULL,lease_until=NULL WHERE account_id=? AND task_id=? AND status='RUNNING' AND lease_token=? AND lease_until>=CURRENT_TIMESTAMP(3)", code == null ? "SUCCEEDED" : "FAILED", output, code, accountId, taskId, lease);
    });
  }
}
