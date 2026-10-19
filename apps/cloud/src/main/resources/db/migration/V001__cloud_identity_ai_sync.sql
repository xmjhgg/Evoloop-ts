CREATE TABLE cloud_account (
  account_id CHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  ai_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  health_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  purpose_version BIGINT NOT NULL DEFAULT 0,
  declaration_version VARCHAR(80) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;
CREATE TABLE cloud_session (
  token_hash CHAR(64) CHARACTER SET ascii NOT NULL PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  expires_at TIMESTAMP(3) NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  device VARCHAR(120) NOT NULL,
  CONSTRAINT session_account FOREIGN KEY (account_id) REFERENCES cloud_account(account_id)
) ENGINE=InnoDB;
CREATE TABLE sync_head (
  account_id CHAR(36) NOT NULL PRIMARY KEY,
  head_version BIGINT NOT NULL DEFAULT 0,
  root_initialized BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT head_account FOREIGN KEY (account_id) REFERENCES cloud_account(account_id)
) ENGINE=InnoDB;
CREATE TABLE sync_batch (
  account_id CHAR(36) NOT NULL,
  batch_id CHAR(36) NOT NULL,
  input_digest CHAR(64) CHARACTER SET ascii NOT NULL,
  server_sequence BIGINT NULL,
  payload MEDIUMTEXT NOT NULL,
  receipt TEXT NOT NULL,
  PRIMARY KEY(account_id, batch_id),
  UNIQUE KEY batch_sequence(account_id, server_sequence),
  CONSTRAINT batch_account FOREIGN KEY (account_id) REFERENCES cloud_account(account_id)
) ENGINE=InnoDB;
CREATE TABLE sync_snapshot (
  account_id CHAR(36) NOT NULL,
  snapshot_id CHAR(36) NOT NULL,
  base_sequence BIGINT NOT NULL,
  manifest_digest CHAR(64) CHARACTER SET ascii NOT NULL,
  manifest MEDIUMTEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  PRIMARY KEY(account_id, snapshot_id),
  CONSTRAINT snapshot_account FOREIGN KEY (account_id) REFERENCES cloud_account(account_id)
) ENGINE=InnoDB;
CREATE TABLE ai_task (
  account_id CHAR(36) NOT NULL,
  task_id CHAR(36) NOT NULL,
  client_request_id CHAR(36) NOT NULL,
  request_digest CHAR(64) CHARACTER SET ascii NOT NULL,
  input_digest CHAR(64) CHARACTER SET ascii NOT NULL,
  request_json MEDIUMTEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  version BIGINT NOT NULL DEFAULT 1,
  purpose_version BIGINT NOT NULL,
  lease_token CHAR(36) NULL,
  lease_until TIMESTAMP(3) NULL,
  output_json MEDIUMTEXT NULL,
  error_code VARCHAR(64) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY(account_id, task_id),
  UNIQUE KEY task_request(account_id, client_request_id),
  KEY task_pending(status, lease_until),
  CONSTRAINT task_account FOREIGN KEY (account_id) REFERENCES cloud_account(account_id)
) ENGINE=InnoDB;
