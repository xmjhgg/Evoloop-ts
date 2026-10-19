package com.evoloop.cloud.modules.sync.application;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.identity.application.Sessions;
import com.evoloop.cloud.modules.sync.validation.BatchValidation;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.LinkedHashMap;

@Service
public class StoreBatch {
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  private final BatchValidation validation;
  private final Sessions sessions;
  public StoreBatch(JdbcTemplate sql, TransactionTemplate transactions, BatchValidation validation, Sessions sessions) {
    this.sql = sql; this.transactions = transactions; this.validation = validation; this.sessions = sessions;
  }
  public JsonNode execute(String accountId, JsonNode batch) {
    String digest = validation.validate(accountId, batch), batchId = batch.get("batchId").asText();
    return transactions.execute(status -> {
      sessions.lockCurrent(accountId);
      Long head = sql.queryForObject("SELECT head_version FROM sync_head WHERE account_id=? FOR UPDATE", Long.class, accountId);
      var previous = sql.queryForList("SELECT input_digest,receipt FROM sync_batch WHERE account_id=? AND batch_id=?", accountId, batchId);
      if (!previous.isEmpty()) {
        CloudError.check(digest.equals(previous.getFirst().get("input_digest")), 409, "BATCH_ID_REUSED");
        return Canonical.parse((String) previous.getFirst().get("receipt"));
      }
      boolean matches = Long.parseLong(batch.get("expectedHeadVersion").asText()) == head;
      var receipt = new LinkedHashMap<String, Object>();
      receipt.put("batchId", batchId); receipt.put("inputDigest", digest);
      receipt.put("status", matches ? "STORED" : "CONFLICT");
      receipt.put("serverSequence", matches ? Long.toString(head + 1) : null);
      receipt.put("currentHeadVersion", matches ? Long.toString(head + 1) : head.toString());
      receipt.put("code", matches ? null : "SYNC_VERSION_CONFLICT");
      JsonNode result = Canonical.JSON.valueToTree(receipt);
      sql.update("INSERT INTO sync_batch(account_id,batch_id,input_digest,server_sequence,payload,receipt) VALUES(?,?,?,?,?,?)", accountId, batchId, digest, matches ? head + 1 : null, Canonical.text(batch), Canonical.text(result));
      if (matches) sql.update("UPDATE sync_head SET head_version=?,root_initialized=TRUE WHERE account_id=?", head + 1, accountId);
      return result;
    });
  }
}
