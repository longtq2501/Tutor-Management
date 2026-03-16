package com.tutor_management.backend.modules.audit.security;

import com.tutor_management.backend.modules.audit.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor for auditing sensitive HTTP requests.
 * Captures basic info about state-changing operations.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogInterceptor implements HandlerInterceptor {

    private final AuditService auditService;

    // We log after the request is completed to capture the final status
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String method = request.getMethod();
        
        // We primarily care about mutations (POST, PUT, DELETE, PATCH)
        if (isMutation(method)) {
            int status = response.getStatus();
            String path = request.getRequestURI();
            
            // Log successful or failed sensitive operations
            if (isSensitivePath(path)) {
                String action = method + ":" + path;
                String description = String.format("Request %s %s completed with status %d", method, path, status);
                
                if (ex != null) {
                    description += " and error: " + ex.getMessage();
                }
                
                String metadata = String.format("{\"ip\":\"%s\",\"userAgent\":\"%s\"}", 
                        request.getRemoteAddr(), request.getHeader("User-Agent"));
                
                auditService.log(action, description, metadata);
            }
        }
    }

    // Helper method to determine if the HTTP method is a mutation
    private boolean isMutation(String method) {
        return "POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method) || "PATCH".equals(method);
    }

    // Helper method to determine if the request path is considered sensitive
    private boolean isSensitivePath(String path) {
        return path.contains("/api/auth") || 
               path.contains("/api/admin") || 
               path.contains("/api/permissions") ||
               path.contains("/api/system");
    }
}
