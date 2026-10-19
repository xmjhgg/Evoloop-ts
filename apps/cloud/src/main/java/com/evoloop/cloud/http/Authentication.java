package com.evoloop.cloud.http;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import com.evoloop.cloud.modules.identity.application.Sessions;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Component
public class Authentication extends OncePerRequestFilter {
  private final Sessions sessions;
  public Authentication(Sessions sessions) { this.sessions = sessions; }
  @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
    String path = request.getRequestURI();
    try {
      CloudError.check(request.getContentLengthLong() <= 8 * 1024 * 1024, 413, "INPUT_TOO_LARGE");
      if (path.startsWith("/api/v2/") && !(request.getMethod().equals("POST") && (path.equals("/api/v2/identity/accounts") || path.equals("/api/v2/identity/sessions/password")))) {
        String header = request.getHeader("Authorization");
        String credential = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        request.setAttribute("account", sessions.authenticate(credential));
        request.setAttribute("credential", credential);
      }
      HttpServletRequest bounded = path.startsWith("/api/v2/") && (request.getMethod().equals("POST") || request.getMethod().equals("PUT")) ? new BoundedBody(request) : request;
      chain.doFilter(bounded, response);
    } catch (CloudError error) {
      response.setStatus(error.status);
      response.setContentType("application/json");
      response.getWriter().write(Canonical.JSON.writeValueAsString(Map.of("code", error.code, "requestId", UUID.randomUUID().toString())));
    } catch (org.springframework.dao.DataAccessException error) {
      response.setStatus(503); response.setContentType("application/json");
      response.getWriter().write(Canonical.JSON.writeValueAsString(Map.of("code", "DEPENDENCY_UNAVAILABLE", "requestId", UUID.randomUUID().toString())));
    }
  }
}
