package com.evoloop.cloud.modules.sync.application;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.http.ProtocolValidator;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.identity.application.Sessions;
import com.evoloop.cloud.infrastructure.mysql.BlobStorage;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.Map;

@Service
public class Snapshots {
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  private final ProtocolValidator validator;
  private final Sessions sessions;
  private final BlobStorage blobs;
  public Snapshots(JdbcTemplate sql, TransactionTemplate transactions, ProtocolValidator validator, Sessions sessions, BlobStorage blobs) {
    this.sql = sql; this.transactions = transactions; this.validator = validator; this.sessions = sessions; this.blobs = blobs;
  }
  public Object stage(String accountId, JsonNode manifest) {
    validator.validate("Snapshot", manifest);
    try { Long.parseLong(manifest.get("baseSequence").asText()); }
    catch (NumberFormatException error) { throw new CloudError(422, "SEQUENCE_RANGE_INVALID"); }
    int expected = 0;
    for (JsonNode chunk : manifest.get("chunks")) {
      CloudError.check(chunk.get("index").asText().equals(Integer.toString(expected++)), 422, "SNAPSHOT_INCOMPLETE");
      CloudError.check(Canonical.hash(chunk.get("data").asText()).equals(chunk.get("digest").asText()), 422, "DIGEST_MISMATCH");
      JsonNode content = Canonical.parse(chunk.get("data").asText());
      validator.validate("SnapshotChunk", content);
      CloudError.check(content.get("accountId").asText().equals(accountId), 403, "OWNER_MISMATCH");
      for (JsonNode rows : content.get("rows")) for (JsonNode row : rows) CloudError.check(row.get("accountId").asText().equals(accountId), 403, "OWNER_MISMATCH");
    }
    return transactions.execute(status -> {
      sessions.lockCurrent(accountId);
      var previous = sql.queryForList("SELECT manifest_digest,status FROM sync_snapshot WHERE account_id=? AND snapshot_id=?", accountId, manifest.get("snapshotId").asText());
      String digest = Canonical.hash(Canonical.text(manifest));
      if (!previous.isEmpty()) CloudError.check(digest.equals(previous.getFirst().get("manifest_digest")), 409, "SNAPSHOT_ID_REUSED");
      else sql.update("INSERT INTO sync_snapshot(account_id,snapshot_id,base_sequence,manifest_digest,manifest,status) VALUES(?,?,?,?,?,'TEMPORARY')", accountId, manifest.get("snapshotId").asText(), manifest.get("baseSequence").asText(), digest, Canonical.text(manifest));
      return Map.of("snapshotId", manifest.get("snapshotId").asText(), "status", previous.isEmpty() ? "TEMPORARY" : previous.getFirst().get("status"));
    });
  }
  public Object complete(String accountId, String id, boolean root) {
    return transactions.execute(status -> {
      sessions.lockCurrent(accountId);
      var head = sql.queryForMap("SELECT head_version,root_initialized FROM sync_head WHERE account_id=? FOR UPDATE", accountId);
      var rows = sql.queryForList("SELECT base_sequence,status,manifest FROM sync_snapshot WHERE account_id=? AND snapshot_id=? FOR UPDATE", accountId, id);
      CloudError.check(!rows.isEmpty(), 404, "SNAPSHOT_NOT_FOUND");
      var snapshot = rows.getFirst();
      for (JsonNode attachment : Canonical.parse((String) snapshot.get("manifest")).get("attachments")) {
        if (attachment.get("complete").asBoolean()) CloudError.check(blobs.matches(accountId, "SYNC", attachment.get("id").asText(), attachment.get("digest").asText()), 409, "ATTACHMENT_MISSING");
      }
      if (root) CloudError.check(!(Boolean) head.get("root_initialized"), 409, "ROOT_ALREADY_EXISTS");
      CloudError.check(snapshot.get("base_sequence").equals(head.get("head_version")), 409, "SYNC_VERSION_CONFLICT");
      sql.update("UPDATE sync_snapshot SET status='COMPLETE' WHERE account_id=? AND snapshot_id=?", accountId, id);
      sql.update("UPDATE sync_head SET root_initialized=TRUE WHERE account_id=?", accountId);
      return Map.of("snapshotId", id, "status", "COMPLETE");
    });
  }
  public JsonNode read(String accountId, String id) {
    var rows = sql.queryForList("SELECT manifest FROM sync_snapshot WHERE account_id=? AND snapshot_id=? AND status='COMPLETE'", accountId, id);
    CloudError.check(!rows.isEmpty(), 404, "SNAPSHOT_NOT_FOUND");
    return Canonical.parse((String) rows.getFirst().get("manifest"));
  }
}
