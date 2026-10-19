package com.evoloop.cloud.http;

public final class CloudError extends RuntimeException {
  public final int status;
  public final String code;
  public CloudError(int status, String code) {
    super(code);
    this.status = status;
    this.code = code;
  }
  public static void check(boolean condition, int status, String code) {
    if (!condition) throw new CloudError(status, code);
  }
}
