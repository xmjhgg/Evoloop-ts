package com.evoloop.cloud.infrastructure.mysql;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

@Service
public class BlobStorage {
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  public BlobStorage(JdbcTemplate sql, TransactionTemplate transactions) { this.sql = sql; this.transactions = transactions; }
  public Object store(String accountId, String purpose, JsonNode input) {
    byte[] content;
    try { content = Base64.getDecoder().decode(input.get("dataBase64").asText()); }
    catch (IllegalArgumentException error) { throw new CloudError(422, "ASSET_INVALID"); }
    CloudError.check(content.length > 0 && content.length <= 4194304, 413, "INPUT_TOO_LARGE");
    String digest;
    try { digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content)); }
    catch (Exception error) { throw new IllegalStateException(error); }
    CloudError.check(digest.equals(input.get("digest").asText()), 422, "DIGEST_MISMATCH");
    if (purpose.equals("AI")) validateImage(content, input.get("mediaType").asText());
    return transactions.execute(status -> {
      var accounts = sql.queryForList("SELECT ai_allowed,health_allowed FROM cloud_account WHERE account_id=? AND status='ACTIVE' FOR UPDATE", accountId);
      CloudError.check(!accounts.isEmpty(), 401, "ACCOUNT_DISABLED");
      if (purpose.equals("AI")) CloudError.check((Boolean) accounts.getFirst().get("ai_allowed") && (Boolean) accounts.getFirst().get("health_allowed"), 403, "PURPOSE_REQUIRED");
      var previous = sql.queryForList("SELECT digest,media_type FROM cloud_blob WHERE account_id=? AND blob_id=? AND purpose=?", accountId, input.get("id").asText(), purpose);
      if (!previous.isEmpty()) CloudError.check(digest.equals(previous.getFirst().get("digest")) && input.get("mediaType").asText().equals(previous.getFirst().get("media_type")), 409, "ASSET_ID_REUSED");
      else sql.update("INSERT INTO cloud_blob(account_id,blob_id,purpose,digest,media_type,content,expires_at) VALUES(?,?,?,?,?,?," + (purpose.equals("AI") ? "TIMESTAMPADD(HOUR,24,CURRENT_TIMESTAMP(3))" : "NULL") + ")", accountId, input.get("id").asText(), purpose, digest, input.get("mediaType").asText(), content);
      if (!previous.isEmpty() && purpose.equals("AI")) sql.update("UPDATE cloud_blob SET expires_at=TIMESTAMPADD(HOUR,24,CURRENT_TIMESTAMP(3)) WHERE account_id=? AND blob_id=? AND purpose='AI'", accountId, input.get("id").asText());
      return Map.of("id", input.get("id").asText(), "digest", digest, "complete", true);
    });
  }
  private void validateImage(byte[] content, String type) {
    String magic = HexFormat.of().formatHex(java.util.Arrays.copyOf(content, Math.min(content.length, 12)));
    boolean valid = type.equals("image/png") && magic.startsWith("89504e470d0a1a0a") || type.equals("image/jpeg") && magic.startsWith("ffd8ff")
      || type.equals("image/webp") && magic.startsWith("52494646") && magic.endsWith("57454250");
    CloudError.check(valid, 422, "ASSET_MEDIA_INVALID");
  }
  public JsonNode read(String accountId, String purpose, String id) {
    var rows = sql.queryForList("SELECT digest,media_type,content FROM cloud_blob WHERE account_id=? AND purpose=? AND blob_id=? AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP(3))", accountId, purpose, id);
    CloudError.check(!rows.isEmpty(), 404, "ASSET_NOT_FOUND");
    var row = rows.getFirst();
    return Canonical.JSON.valueToTree(Map.of("id", id, "digest", row.get("digest"), "mediaType", row.get("media_type"), "dataBase64", Base64.getEncoder().encodeToString((byte[]) row.get("content"))));
  }
  public boolean matches(String accountId, String purpose, String id, String digest) {
    return sql.queryForObject("SELECT COUNT(*) FROM cloud_blob WHERE account_id=? AND purpose=? AND blob_id=? AND digest=? AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP(3))", Long.class, accountId, purpose, id, digest) == 1L;
  }
  @Scheduled(fixedDelay = 3600000)
  public void expireTemporaryInputs() { sql.update("DELETE FROM cloud_blob WHERE purpose='AI' AND expires_at<CURRENT_TIMESTAMP(3)"); }
}
