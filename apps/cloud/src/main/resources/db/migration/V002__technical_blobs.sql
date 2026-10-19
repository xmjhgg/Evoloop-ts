CREATE TABLE cloud_blob (
  account_id CHAR(36) NOT NULL,
  blob_id CHAR(36) NOT NULL,
  purpose VARCHAR(8) NOT NULL,
  digest CHAR(64) CHARACTER SET ascii NOT NULL,
  media_type VARCHAR(40) NOT NULL,
  content MEDIUMBLOB NOT NULL,
  expires_at TIMESTAMP(3) NULL,
  PRIMARY KEY(account_id, blob_id, purpose),
  KEY blob_expiry(expires_at),
  CONSTRAINT blob_account FOREIGN KEY (account_id) REFERENCES cloud_account(account_id)
) ENGINE=InnoDB;
