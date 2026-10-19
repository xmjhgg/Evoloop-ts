package com.evoloop.cloud.modules.ai.application;

import com.evoloop.cloud.modules.identity.model.PurposeChanged;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class PurposeChangeListener {
  private final JdbcTemplate sql;
  public PurposeChangeListener(JdbcTemplate sql) { this.sql = sql; }
  /** Synchronous technical cancellation joins the purpose-update transaction. */
  @EventListener public void changed(PurposeChanged event) {
    sql.update("UPDATE ai_task SET status='CANCELLED',version=version+1,output_json=NULL WHERE account_id=? AND status IN ('QUEUED','RUNNING')", event.accountId());
  }
}
