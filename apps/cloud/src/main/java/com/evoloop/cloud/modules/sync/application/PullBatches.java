package com.evoloop.cloud.modules.sync.application;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.Map;

@Service
public class PullBatches {
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  public PullBatches(JdbcTemplate sql, TransactionTemplate transactions) { this.sql = sql; this.transactions = transactions; }
  public JsonNode execute(String accountId, String after) {
    CloudError.check(after.matches("0|[1-9]\\d{0,18}"), 422, "INVALID_SEQUENCE");
    long cursor;
    try { cursor = Long.parseLong(after); } catch (NumberFormatException error) { throw new CloudError(422, "INVALID_SEQUENCE"); }
    return transactions.execute(status -> {
      Long head = sql.queryForObject("SELECT head_version FROM sync_head WHERE account_id=? FOR SHARE", Long.class, accountId);
      CloudError.check(cursor <= head, 409, "SEQUENCE_UNAVAILABLE");
      var envelopes = sql.query("SELECT server_sequence,payload FROM sync_batch WHERE account_id=? AND server_sequence>? ORDER BY server_sequence LIMIT 100",
        (row, index) -> Map.of("serverSequence", row.getString("server_sequence"), "batch", Canonical.parse(row.getString("payload"))), accountId, cursor);
      long next = envelopes.isEmpty() ? cursor : Long.parseLong((String) envelopes.getLast().get("serverSequence"));
      CloudError.check(envelopes.isEmpty() ? cursor == head : Long.parseLong((String) envelopes.getFirst().get("serverSequence")) == cursor + 1, 409, "SEQUENCE_UNAVAILABLE");
      return Canonical.JSON.valueToTree(Map.of("envelopes", envelopes, "nextSequence", Long.toString(next), "headVersion", head.toString()));
    });
  }
}
