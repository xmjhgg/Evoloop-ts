package com.evoloop.cloud;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.UUID;
import java.util.Base64;
import static org.junit.jupiter.api.Assertions.*;

class AttachmentTest extends CloudTestSupport {
  @Test void attachmentStorageChecksDigestOwnerAndImmutableId() throws Exception {
    Login account = account(), other = account();
    String id = UUID.randomUUID().toString(), content = "attachment test";
    var input = Map.of("id", id, "digest", Canonical.hash(content), "mediaType", "application/octet-stream", "dataBase64", Base64.getEncoder().encodeToString(content.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    assertEquals(200, request("POST", "/api/v2/sync/attachments", account.token(), input).status());
    assertEquals(200, request("POST", "/api/v2/sync/attachments", account.token(), input).status());
    assertEquals(200, request("GET", "/api/v2/sync/attachments/" + id, account.token(), null).status());
    assertEquals(404, request("GET", "/api/v2/sync/attachments/" + id, other.token(), null).status());
    assertEquals(403, request("POST", "/api/v2/ai/assets", account.token(), input).status());
  }
}
