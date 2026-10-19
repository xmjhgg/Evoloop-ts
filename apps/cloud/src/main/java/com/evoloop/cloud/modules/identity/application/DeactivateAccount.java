package com.evoloop.cloud.modules.identity.application;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.modules.identity.model.PurposeChanged;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class DeactivateAccount {
  private final JdbcTemplate sql;
  private final Sessions sessions;
  private final TransactionTemplate transactions;
  private final ApplicationEventPublisher events;
  public DeactivateAccount(JdbcTemplate sql, Sessions sessions, TransactionTemplate transactions, ApplicationEventPublisher events) {
    this.sql = sql; this.sessions = sessions; this.transactions = transactions; this.events = events;
  }
  public void execute(String accountId, String expectedPurposeVersion) {
    transactions.executeWithoutResult(status -> {
      var account = sessions.lockCurrent(accountId);
      CloudError.check(Long.toString(account.purposeVersion()).equals(expectedPurposeVersion), 409, "VERSION_CONFLICT");
      sql.update("UPDATE cloud_account SET status='DISABLED',ai_allowed=FALSE,health_allowed=FALSE,purpose_version=purpose_version+1 WHERE account_id=?", accountId);
      sql.update("UPDATE cloud_session SET revoked=TRUE WHERE account_id=?", accountId);
      events.publishEvent(new PurposeChanged(accountId));
    });
  }
}
