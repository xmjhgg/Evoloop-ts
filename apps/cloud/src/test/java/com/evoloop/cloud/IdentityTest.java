package com.evoloop.cloud;

import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class IdentityTest extends CloudTestSupport {
  @Test void purposeNoticeMustBeReadAtItsCurrentVersionBeforeGrant() throws Exception {
    Login account = account();
    var notice = request("GET", "/api/v2/identity/purpose-notice", account.token(), null);
    assertEquals(200, notice.status());
    assertEquals("synthetic-test-only", notice.body().get("version").asText());
    assertFalse(notice.body().get("text").asText().isBlank());
    assertEquals(409, request("PUT", "/api/v2/identity/purposes", account.token(), Map.of("healthAllowed", true, "aiAllowed", false, "noticeVersion", "old", "expectedPurposeVersion", "0")).status());
    assertFalse(request("GET", "/api/v2/identity/session", account.token(), null).body().get("healthAllowed").asBoolean());
    assertEquals(200, request("PUT", "/api/v2/identity/purposes", account.token(), Map.of("healthAllowed", true, "aiAllowed", true, "noticeVersion", "synthetic-test-only", "expectedPurposeVersion", "0")).status());
    assertEquals(409, request("PUT", "/api/v2/identity/purposes", account.token(), Map.of("healthAllowed", false, "aiAllowed", false, "noticeVersion", "", "expectedPurposeVersion", "0")).status());
    assertEquals(200, request("PUT", "/api/v2/identity/purposes", account.token(), Map.of("healthAllowed", false, "aiAllowed", true, "noticeVersion", "", "expectedPurposeVersion", "1")).status());
    assertFalse(request("GET", "/api/v2/identity/session", account.token(), null).body().get("healthAllowed").asBoolean());
  }
  @Test void disablingAccountRevokesAccessWithoutDeletingSyncData() throws Exception {
    Login account = account();
    request("POST", "/api/v2/sync/batches", account.token(), batch(account.accountId(), "0"));
    assertEquals(200, request("POST", "/api/v2/identity/account/deactivate", account.token(), Map.of("explicitConfirm", true, "expectedPurposeVersion", "0")).status());
    assertEquals(401, request("GET", "/api/v2/sync/capabilities", account.token(), null).status());
    assertEquals(1L, sql.queryForObject("SELECT COUNT(*) FROM sync_batch WHERE account_id=?", Long.class, account.accountId()));
  }
  @Test void registrationHashLoginIsolationAndRevocation() throws Exception {
    Login first = account(), second = account();
    Long remaining = sql.queryForObject("SELECT TIMESTAMPDIFF(SECOND,CURRENT_TIMESTAMP(3),expires_at) FROM cloud_session WHERE account_id=?", Long.class, first.accountId());
    assertTrue(remaining > 2591980 && remaining <= 2592000, "Session expiry must preserve its UTC instant across host/database time zones");
    var current = request("GET", "/api/v2/identity/session", first.token(), null);
    assertEquals(first.accountId(), current.body().get("accountId").asText());
    assertFalse(current.body().get("aiAllowed").asBoolean());
    assertNotEquals("test-only-long-password!", sql.queryForObject("SELECT password_hash FROM cloud_account WHERE account_id=?", String.class, first.accountId()));
    assertEquals(401, request("GET", "/api/v2/identity/session", null, null).status());
    assertEquals(204, request("DELETE", "/api/v2/identity/session", first.token(), null).status());
    assertEquals(401, request("GET", "/api/v2/identity/session", first.token(), null).status());
    assertEquals(200, request("GET", "/api/v2/identity/session", second.token(), null).status());
  }
  @Test void duplicateUsernameAndWrongPasswordAreExplicitFailures() throws Exception {
    String username = "unique_" + UUID.randomUUID().toString().substring(0, 8);
    var input = Map.of("username", username, "password", "test-long-password-123!", "declarationVersion", "registration-v1");
    assertEquals(201, request("POST", "/api/v2/identity/accounts", null, input).status());
    assertEquals(409, request("POST", "/api/v2/identity/accounts", null, input).status());
    assertEquals("INVALID_CREDENTIALS", request("POST", "/api/v2/identity/sessions/password", null, Map.of("username", username, "password", "wrong", "device", "test")).body().get("code").asText());
  }
  @Test void expiredSessionCannotReadSync() throws Exception {
    Login login = account();
    sql.update("UPDATE cloud_session SET expires_at='2020-01-01' WHERE account_id=?", login.accountId());
    assertEquals(401, request("GET", "/api/v2/sync/capabilities", login.token(), null).status());
  }
}
