package com.evoloop.cloud.modules.identity.application;

import com.evoloop.cloud.http.CloudError;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Bounded single-process edge limiter. A multi-instance deployment requires a shared edge limiter. */
@Component
public class RateLimits {
  private record Window(long minute, int count) {}
  private final Map<String, Window> windows = new HashMap<>();
  public synchronized void check(String key, int limit) {
    long minute = System.currentTimeMillis() / 60000;
    windows.entrySet().removeIf(entry -> entry.getValue().minute < minute - 1);
    CloudError.check(windows.size() < 10000 || windows.containsKey(key), 429, "RATE_LIMITED");
    Window previous = windows.get(key);
    int count = previous == null || previous.minute != minute ? 1 : previous.count + 1;
    windows.put(key, new Window(minute, count));
    CloudError.check(count <= limit, 429, "RATE_LIMITED");
  }
}
