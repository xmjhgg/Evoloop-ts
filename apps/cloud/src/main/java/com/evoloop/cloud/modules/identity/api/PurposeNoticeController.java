package com.evoloop.cloud.modules.identity.api;

import com.evoloop.cloud.modules.identity.application.PurposeNotice;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class PurposeNoticeController {
  private final PurposeNotice notice;
  public PurposeNoticeController(PurposeNotice notice) { this.notice = notice; }
  @GetMapping("/api/v2/identity/purpose-notice")
  public Map<String, String> read() { return notice.read(); }
}
