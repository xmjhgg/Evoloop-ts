package com.evoloop.cloud.modules.identity.application;

import com.evoloop.cloud.http.CloudError;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class PurposeNotice {
  private final String version;
  private final String text;
  public PurposeNotice(@Value("${evoloop.purpose-notice-version}") String version, @Value("${evoloop.purpose-notice-text:}") String text) {
    this.version = version; this.text = text;
  }
  public Map<String, String> read() {
    CloudError.check(!version.isBlank() && !text.isBlank(), 503, "PURPOSE_NOTICE_UNAVAILABLE");
    return Map.of("version", version, "text", text);
  }
  public void verify(String expected) {
    read();
    CloudError.check(version.equals(expected), 409, "PURPOSE_NOTICE_CHANGED");
  }
  public String version() { return version; }
}
