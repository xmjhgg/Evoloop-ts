package com.evoloop.cloud;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import java.util.concurrent.Executors;
import static org.junit.jupiter.api.Assertions.*;

class SyncTest extends CloudTestSupport {
  @Test void concurrentBatchesCompareAccountHeadAndKeepImmutableReceipts() throws Exception {
    Login login = account();
    var a = batch(login.accountId(), "0");
    var b = batch(login.accountId(), "0");
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(() -> request("POST", "/api/v2/sync/batches", login.token(), a));
      var second = executor.submit(() -> request("POST", "/api/v2/sync/batches", login.token(), b));
      var x = first.get();
      var y = second.get();
      assertEquals(200, x.status(), x.body().toString());
      assertEquals(200, y.status(), y.body().toString());
      assertNotEquals(x.body().get("status"), y.body().get("status"));
      assertTrue(x.body().get("status").asText().equals("STORED") || y.body().get("status").asText().equals("STORED"));
      assertEquals(x.body(), request("POST", "/api/v2/sync/batches", login.token(), a).body());
      assertEquals(y.body(), request("POST", "/api/v2/sync/batches", login.token(), b).body());
    }
    assertEquals("1", request("GET", "/api/v2/sync/capabilities", login.token(), null).body().get("headVersion").asText());
    var pulled = request("GET", "/api/v2/sync/batches?afterSequence=0", login.token(), null);
    assertEquals(1, pulled.body().get("envelopes").size());
  }
  @Test void crossAccountPayloadBadDigestAndReusedBatchIdAreRejected() throws Exception {
    Login first = account(), second = account();
    var batch = (ObjectNode) batch(first.accountId(), "0");
    assertEquals(403, request("POST", "/api/v2/sync/batches", second.token(), batch).status());
    assertEquals(200, request("POST", "/api/v2/sync/batches", first.token(), batch).status());
    batch.put("expectedHeadVersion", "1");
    assertEquals(422, request("POST", "/api/v2/sync/batches", first.token(), batch).status());
    batch.remove("payloadDigest"); batch.put("payloadDigest", Canonical.hash(Canonical.text(batch)));
    assertEquals(409, request("POST", "/api/v2/sync/batches", first.token(), batch).status());
    assertEquals(0, request("GET", "/api/v2/sync/batches", second.token(), null).body().get("envelopes").size());
  }
  @Test void transactionFailureDoesNotPersistBatchOrHead() throws Exception {
    Login login = account();
    // The trigger affects only this isolated test account and is always removed.
    sql.execute("CREATE TRIGGER test_fail_head BEFORE UPDATE ON sync_head FOR EACH ROW BEGIN IF NEW.account_id='" + login.accountId() + "' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test rollback'; END IF; END");
    try {
      assertEquals(503, request("POST", "/api/v2/sync/batches", login.token(), batch(login.accountId(), "0")).status());
      assertEquals(0L, sql.queryForObject("SELECT COUNT(*) FROM sync_batch WHERE account_id=?", Long.class, login.accountId()));
      assertEquals(0L, sql.queryForObject("SELECT head_version FROM sync_head WHERE account_id=?", Long.class, login.accountId()));
    } finally { sql.execute("DROP TRIGGER test_fail_head"); }
  }
}
