package com.evoloop.cloud.modules.sync.validation;

import com.evoloop.cloud.http.CloudError;
import com.evoloop.cloud.http.ProtocolValidator;
import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import java.math.BigInteger;
import java.util.HashSet;

@Component
public class BatchValidation {
  private final ProtocolValidator validator;
  public BatchValidation(ProtocolValidator validator) { this.validator = validator; }
  public String validate(String accountId, JsonNode input) {
    validator.validate("SyncBatch", input);
    ObjectNode content = ((ObjectNode) input).deepCopy();
    content.remove("payloadDigest");
    String digest = Canonical.hash(Canonical.text(content));
    CloudError.check(digest.equals(input.get("payloadDigest").asText()), 422, "DIGEST_MISMATCH");
    CloudError.check(new BigInteger(input.get("expectedHeadVersion").asText()).compareTo(BigInteger.valueOf(Long.MAX_VALUE - 1)) <= 0, 422, "SEQUENCE_RANGE_INVALID");
    var touched = new HashSet<String>();
    for (JsonNode change : input.get("changes")) {
      CloudError.check(touched.add(change.get("table").asText() + "|" + change.get("id").asText()), 422, "DUPLICATE_CHANGE");
      CloudError.check(!change.get("before").isNull() || !change.get("after").isNull(), 422, "EMPTY_CHANGE");
      for (String side : new String[]{"before", "after"}) {
        JsonNode row = change.get(side);
        if (row.isNull()) continue;
        CloudError.check(accountId.equals(row.get("accountId").asText()), 403, "OWNER_MISMATCH");
        CloudError.check(change.get("id").equals(row.get("id")), 422, "KEY_MISMATCH");
        // Shape and canonical bytes only. The server does not interpret the domain document.
        String data = row.get("data").asText();
        CloudError.check(Canonical.text(Canonical.parse(data)).equals(data), 422, "NONCANONICAL_DATA");
      }
    }
    return digest;
  }
}
