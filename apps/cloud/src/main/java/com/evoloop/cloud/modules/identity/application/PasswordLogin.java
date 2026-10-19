package com.evoloop.cloud.modules.identity.application;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.generated.Wire;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Map;

@Service
public class PasswordLogin {
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(12);
  private final String dummyHash = passwords.encode("unused random timing equalizer");
  public PasswordLogin(JdbcTemplate sql, TransactionTemplate transactions) { this.sql = sql; this.transactions = transactions; }
  public Map<String, String> execute(Wire.Login input) {
    var rows = sql.queryForList("SELECT account_id,password_hash,status FROM cloud_account WHERE username=?", input.username());
    var row = rows.isEmpty() ? null : rows.getFirst();
    boolean matches = passwords.matches(input.password(), row == null ? dummyHash : (String) row.get("password_hash"));
    CloudError.check(matches && row != null && row.get("status").equals("ACTIVE"), 401, "INVALID_CREDENTIALS");
    String accountId = (String) row.get("account_id");
    byte[] random = new byte[32];
    new SecureRandom().nextBytes(random);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    Instant expiresAt = Instant.now().plus(30, ChronoUnit.DAYS);
    transactions.executeWithoutResult(status -> {
      String currentStatus = sql.queryForObject("SELECT status FROM cloud_account WHERE account_id=? FOR UPDATE", String.class, accountId);
      CloudError.check("ACTIVE".equals(currentStatus), 401, "INVALID_CREDENTIALS");
      sql.update("INSERT INTO cloud_session(token_hash,account_id,expires_at,device) VALUES(?,?,?,?)", Canonical.hash(token), accountId, Timestamp.from(expiresAt), input.device());
    });
    return Map.of("credential", token, "expiresAt", expiresAt.toString(), "accountId", accountId);
  }
}
