package com.evoloop.cloud.http;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class ErrorAdvice {
  @ExceptionHandler(CloudError.class)
  public ResponseEntity<Map<String, String>> known(CloudError error) {
    return ResponseEntity.status(error.status).body(Map.of("code", error.code, "requestId", UUID.randomUUID().toString()));
  }
  @ExceptionHandler({HttpMessageNotReadableException.class, IllegalArgumentException.class})
  public ResponseEntity<Map<String, String>> invalid(Exception error) { return known(new CloudError(400, "PAYLOAD_INVALID")); }
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> unexpected(Exception error) {
    return known(new CloudError(503, "SERVICE_UNAVAILABLE"));
  }
}
