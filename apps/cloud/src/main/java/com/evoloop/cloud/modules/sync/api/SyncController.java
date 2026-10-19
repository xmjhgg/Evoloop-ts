package com.evoloop.cloud.modules.sync.api;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.http.ProtocolValidator;
import com.evoloop.cloud.modules.identity.model.Account;
import com.evoloop.cloud.modules.identity.application.RateLimits;
import com.evoloop.cloud.modules.sync.application.*;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/sync")
public class SyncController {
  private final StoreBatch store;
  private final PullBatches pull;
  private final Snapshots snapshots;
  private final JdbcTemplate sql;
  private final RateLimits limits;
  private final ProtocolValidator validator;
  public SyncController(StoreBatch store, PullBatches pull, Snapshots snapshots, JdbcTemplate sql, RateLimits limits, ProtocolValidator validator) {
    this.store = store; this.pull = pull; this.snapshots = snapshots; this.sql = sql; this.limits = limits;
    this.validator = validator;
  }
  @GetMapping("/capabilities")
  public Object capabilities(@RequestAttribute Account account) {
    var head = sql.queryForMap("SELECT head_version,root_initialized FROM sync_head WHERE account_id=?", account.id());
    var snapshots = sql.queryForList("SELECT snapshot_id,base_sequence FROM sync_snapshot WHERE account_id=? AND status='COMPLETE' ORDER BY base_sequence DESC,snapshot_id LIMIT 1", account.id());
    var result = new java.util.LinkedHashMap<String, Object>();
    result.put("syncProtocolVersions", new String[]{"1"}); result.put("payloadSchemaVersions", new String[]{"documents-v1"});
    result.put("headVersion", head.get("head_version").toString()); result.put("rootInitialized", head.get("root_initialized"));
    result.put("snapshotId", snapshots.isEmpty() ? null : snapshots.getFirst().get("snapshot_id"));
    result.put("snapshotSequence", snapshots.isEmpty() ? null : snapshots.getFirst().get("base_sequence").toString());
    result.put("maxChanges", "2000"); result.put("maxBytes", "8388608");
    return result;
  }
  @PostMapping("/batches")
  public Object store(@RequestAttribute Account account, @RequestBody JsonNode batch) {
    limits.check("sync:" + account.id(), 120);
    return store.execute(account.id(), batch);
  }
  @GetMapping("/batches")
  public Object pull(@RequestAttribute Account account, @RequestParam(defaultValue = "0") String afterSequence) { return pull.execute(account.id(), afterSequence); }
  @PostMapping("/snapshots")
  public Object stage(@RequestAttribute Account account, @RequestBody JsonNode manifest) { return snapshots.stage(account.id(), manifest); }
  @PostMapping("/snapshots/{id}/complete")
  public Object complete(@RequestAttribute Account account, @PathVariable String id) { return snapshots.complete(account.id(), id, false); }
  @GetMapping("/snapshots/{id}")
  public Object snapshot(@RequestAttribute Account account, @PathVariable String id) { return snapshots.read(account.id(), id); }
  @PostMapping("/roots")
  public Object root(@RequestAttribute Account account, @RequestBody JsonNode input) {
    validator.validate("RootRequest", input);
    return snapshots.complete(account.id(), input.get("snapshotId").asText(), true);
  }
}
