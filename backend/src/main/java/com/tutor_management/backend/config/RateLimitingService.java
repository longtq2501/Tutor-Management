package com.tutor_management.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Service to manage rate-limit buckets for different resources (e.g., login attempts by IP).
 */
@Service
public class RateLimitingService {

    // Cache to store buckets for each IP address
    // We use Caffeine to automatically remove old buckets after a period of inactivity
    private final Cache<String, Bucket> cache;

    public RateLimitingService() {
        this.cache = Caffeine.newBuilder()
                .expireAfterAccess(1, TimeUnit.HOURS)
                .maximumSize(1000)
                .build();
    }

    /**
     * Resolves the bucket for a specific IP. Creates a new one if it doesn't exist.
     * @param ipAddress The user's IP address.
     * @return The Bucket for this IP.
     */
    public Bucket resolveBucket(String ipAddress) {
        return cache.get(ipAddress, key -> createNewBucket());
    }

    /**
     * Creates a new bucket with a predefined rate limit.
     * Limit: 5 requests per minute, refilling continuously.
     */
    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
