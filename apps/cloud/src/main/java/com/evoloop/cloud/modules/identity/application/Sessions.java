package com.evoloop.cloud.modules.identity.application;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.identity.model.Account;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class Sessions {
  private final JdbcTemplate sql;
  public Sessions(JdbcTemplate sql) { this.sql = sql; }
  public Account authenticate(String credential) {
    CloudError.check(credential != null && credential.matches("[A-Za-z0-9_-]{43}"), 401, "SESSION_REQUIRED");
    var accounts = sql.query("SELECT a.* FROM cloud_session s JOIN cloud_account a ON a.account_id=s.account_id WHERE s.token_hash=? AND s.revoked=FALSE AND s.expires_at>CURRENT_TIMESTAMP(3) AND a.status='ACTIVE'",
      (row, index) -> new Account(row.getString("account_id"), row.getString("username"), row.getBoolean("ai_allowed"), row.getBoolean("health_allowed"), row.getLong("purpose_version")), Canonical.hash(credential));
    CloudError.check(!accounts.isEmpty(), 401, "SESSION_EXPIRED");
    return accounts.getFirst();
  }
  public void revoke(String credential) { sql.update("UPDATE cloud_session SET revoked=TRUE WHERE token_hash=?", Canonical.hash(credential)); }
  public Account lockCurrent(String accountId) {
    var accounts = sql.query("SELECT * FROM cloud_account WHERE account_id=? AND status='ACTIVE' FOR UPDATE",
      (row, index) -> new Account(row.getString("account_id"), row.getString("username"), row.getBoolean("ai_allowed"), row.getBoolean("health_allowed"), row.getLong("purpose_version")), accountId);
    CloudError.check(!accounts.isEmpty(), 401, "ACCOUNT_DISABLED");
    return accounts.getFirst();
  }
}
