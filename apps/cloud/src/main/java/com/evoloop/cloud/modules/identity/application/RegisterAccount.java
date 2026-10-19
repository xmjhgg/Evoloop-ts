package com.evoloop.cloud.modules.identity.application;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.generated.Wire;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Service
public class RegisterAccount {
  private final JdbcTemplate sql;
  private final TransactionTemplate transactions;
  private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(12);
  public RegisterAccount(JdbcTemplate sql, TransactionTemplate transactions) { this.sql = sql; this.transactions = transactions; }
  public Map<String, String> execute(Wire.Registration input) {
    int bytes = input.password().getBytes(StandardCharsets.UTF_8).length;
    CloudError.check(bytes >= 16 && bytes <= 72, 422, "PASSWORD_LENGTH_INVALID");
    String accountId = UUID.randomUUID().toString(), hash = passwords.encode(input.password());
    try {
      transactions.executeWithoutResult(status -> {
        sql.update("INSERT INTO cloud_account(account_id,username,password_hash,declaration_version) VALUES(?,?,?,?)", accountId, input.username(), hash, input.declarationVersion());
        sql.update("INSERT INTO sync_head(account_id) VALUES(?)", accountId);
      });
    } catch (DuplicateKeyException error) { throw new CloudError(409, "USERNAME_UNAVAILABLE"); }
    return Map.of("accountId", accountId, "username", input.username());
  }
}
