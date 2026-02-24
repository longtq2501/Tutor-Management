package com.tutor_management.backend.modules.onlinesession.security;

import com.tutor_management.backend.modules.onlinesession.exception.InvalidTokenException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for managing room access tokens (JWT).
 */
@Service
public class RoomTokenService {

    @Value("${app.online-session.jwt.secret}")
    private String secretKey;

    @Value("${app.online-session.jwt.expiration}")
    private long jwtExpiration;

    /**
     * Generates a JWT for room access.
     */
    public String generateToken(String roomId, Long userId, String roleName) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("roomId", roomId);
        extraClaims.put("userId", userId);
        extraClaims.put("role", roleName);

        return Jwts.builder()
                .claims(extraClaims)
                .subject(userId.toString())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    /**
     * Validates a room token and extracts claims.
     * 
     * @param token The JWT token to validate.
     * @return Claims if valid.
     * @throws InvalidTokenException if token is invalid, expired, or malformed.
     */
    public Claims validateToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSignInKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new InvalidTokenException("Room token has expired");
        } catch (SignatureException e) {
            throw new InvalidTokenException("Invalid token signature");
        } catch (MalformedJwtException e) {
            throw new InvalidTokenException("Malformed token");
        } catch (Exception e) {
            throw new InvalidTokenException("Token validation failed: " + e.getMessage());
        }
    }

    /**
     * Extracts the room ID from a validated token.
     */
    public String extractRoomId(String token) {
        Claims claims = validateToken(token);
        return claims.get("roomId", String.class);
    }

    /**
     * Extracts the user ID from a validated token.
     */
    public Long extractUserId(String token) {
        Claims claims = validateToken(token);
        return Long.valueOf(claims.get("userId").toString());
    }

    /**
     * Extracts the role from a validated token.
     */
    public String extractRole(String token) {
        Claims claims = validateToken(token);
        return claims.get("role", String.class);
    }

    /**
     * Checks if a token is expired.
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = validateToken(token);
            return claims.getExpiration().before(new Date());
        } catch (InvalidTokenException e) {
            return true;
        }
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}