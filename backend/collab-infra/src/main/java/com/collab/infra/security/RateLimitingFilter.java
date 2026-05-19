package com.collab.infra.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1) // Executed very early in the filter chain
@Slf4j
public class RateLimitingFilter implements Filter {

    // Thread-safe map storing token-buckets per Client IP address
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        // High-performance token-bucket: 60 requests per minute capacity, refilling 60 tokens per minute
        return Bucket.builder()
                .addLimit(Bandwidth.classic(60, Refill.intervally(60, Duration.ofMinutes(1))))
                .build();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Skip rate-limiting for static assets or health checks
        String path = httpRequest.getRequestURI();
        if (path.contains("/actuator") || path.contains("/ws")) {
            chain.doFilter(request, response);
            return;
        }

        String ip = httpRequest.getRemoteAddr();
        Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());

        if (bucket.tryConsume(1)) {
            // Success - attach rate-limiting context headers
            httpResponse.setHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            httpResponse.setHeader("X-Rate-Limit-Limit", "60");
            chain.doFilter(request, response);
        } else {
            // Reject - Too Many Requests!
            log.warn("Rate-limit exceeded for IP: {} requesting path: {}", ip, path);
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"status\": 429, \"error\": \"Too Many Requests\", \"message\": \"API rate limit exceeded. Please try again later.\"}");
        }
    }
}
