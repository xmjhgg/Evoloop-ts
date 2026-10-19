package com.evoloop.cloud.http;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

final class BoundedBody extends HttpServletRequestWrapper {
  private final byte[] bytes;
  BoundedBody(HttpServletRequest request) throws IOException {
    super(request);
    bytes = request.getInputStream().readNBytes(8388609);
    CloudError.check(bytes.length <= 8388608, 413, "INPUT_TOO_LARGE");
  }
  @Override public ServletInputStream getInputStream() {
    var stream = new ByteArrayInputStream(bytes);
    return new ServletInputStream() {
      public int read() { return stream.read(); }
      public int read(byte[] target, int offset, int length) { return stream.read(target, offset, length); }
      public boolean isFinished() { return stream.available() == 0; }
      public boolean isReady() { return true; }
      public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException("Synchronous request only"); }
    };
  }
  @Override public BufferedReader getReader() { return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8)); }
}
