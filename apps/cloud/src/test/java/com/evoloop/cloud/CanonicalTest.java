package com.evoloop.cloud;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.http.CloudError;
import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

class CanonicalTest {
  @Test void typescriptGoldenBytesAndDigestsMatchJava() throws Exception {
    var samples = Canonical.parse(Files.readString(Path.of("../../contracts/examples/canonical-v1.json")));
    for (var sample : samples) {
      String text = Canonical.text(sample.get("value"));
      assertEquals(sample.get("canonical").asText(), text);
      assertEquals(sample.get("digest").asText(), Canonical.hash(text));
    }
    assertThrows(CloudError.class, () -> Canonical.text(Canonical.parse("{\"unsafe\":9007199254740993}")));
    assertThrows(CloudError.class, () -> Canonical.text(Canonical.JSON.getNodeFactory().textNode("\uD800")));
    var validator = new com.evoloop.cloud.http.ProtocolValidator();
    validator.validate("Login", Canonical.JSON.valueToTree(java.util.Map.of("username", "abc", "password", "password", "device", "😀".repeat(120))));
    assertThrows(CloudError.class, () -> validator.validate("Login", Canonical.JSON.valueToTree(java.util.Map.of("username", "abc", "password", "password", "device", "😀".repeat(121)))));
  }
}
