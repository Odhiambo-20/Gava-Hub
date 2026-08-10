package com.gavahub.shared.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestIdFilter extends OncePerRequestFilter {
    private static final String HEADER = "X-Request-ID";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestId = request.getHeader(HEADER);
        if (requestId == null || requestId.isBlank() || requestId.length() > 100) {
            requestId = UUID.randomUUID().toString();
        }
        try (MDC.MDCCloseable ignored = MDC.putCloseable("requestId", requestId)) {
            response.setHeader(HEADER, requestId);
            filterChain.doFilter(request, response);
        }
    }
}
