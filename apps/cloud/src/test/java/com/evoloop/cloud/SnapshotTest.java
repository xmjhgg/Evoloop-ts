package com.evoloop.cloud;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class SnapshotTest extends CloudTestSupport {
  @Test void temporarySnapshotIsNotRecoverableAndRootCannotOverwriteExistingVersion() throws Exception {
    Login account = account(), other = account();
    String id = UUID.randomUUID().toString(), data = Canonical.text(Canonical.JSON.valueToTree(Map.of("accountId", account.accountId(), "rows", Map.of())));
    var input = Map.of("snapshotId", id, "baseSequence", "0", "payloadSchemaVersion", "documents-v1", "attachments", List.of(),
      "chunks", List.of(Map.of("index", "0", "data", data, "digest", Canonical.hash(data))));
    assertEquals(200, request("POST", "/api/v2/sync/snapshots", account.token(), input).status());
    assertEquals(404, request("GET", "/api/v2/sync/snapshots/" + id, account.token(), null).status());
    assertEquals(200, request("POST", "/api/v2/sync/roots", account.token(), Map.of("snapshotId", id)).status());
    assertEquals(200, request("GET", "/api/v2/sync/snapshots/" + id, account.token(), null).status());
    assertEquals(404, request("GET", "/api/v2/sync/snapshots/" + id, other.token(), null).status());
    assertEquals(409, request("POST", "/api/v2/sync/roots", account.token(), Map.of("snapshotId", id)).status());
  }
  @Test void incompleteOrWrongDigestCannotBecomeARecoverySnapshot() throws Exception {
    Login account = account();
    var input = Map.of("snapshotId", UUID.randomUUID().toString(), "baseSequence", "0", "payloadSchemaVersion", "documents-v1", "attachments", List.of(),
      "chunks", List.of(Map.of("index", "1", "data", "{}", "digest", Canonical.hash("{}"))));
    assertEquals("SNAPSHOT_INCOMPLETE", request("POST", "/api/v2/sync/snapshots", account.token(), input).body().get("code").asText());
  }
}
