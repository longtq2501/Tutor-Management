package com.tutor_management.backend.modules.auth;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * User entity representing application users.
 * Implements UserDetails for Spring Security integration.
 */
@Entity
@Table(name = "users",
       indexes = {
           @Index(name = "idx_users_email", columnList = "email"), 
           @Index(name = "idx_users_student_id", columnList = "student_id")
       })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private RoleEntity role;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean accountNonLocked = true;

    // ✅ THÊM DUY NHẤT: Link to Student (for STUDENT role)
    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "account_name")
    private String accountName;

    @Column(name = "bank_code")
    private String bankCode;

    @Column(name = "role")
    private String roleName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(name = "tour_completed", nullable = false)
    private boolean tourCompleted = false;

    @Column(name = "tour_completed_at")
    private LocalDateTime tourCompletedAt;

    @Column(name = "google_access_token", length = 2048)
    private String googleAccessToken;

    @Column(name = "google_refresh_token", length = 512)
    private String googleRefreshToken;

    @Column(name = "google_token_expiry")
    private LocalDateTime googleTokenExpiry;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        syncRoleName();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        syncRoleName();
    }

    private void syncRoleName() {
        if (this.role != null) {
            this.roleName = this.role.getName();
        }
    }

    // Manual Getters to bypass Lombok issues
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public RoleEntity getRole() { return role; }
    
    public void setRole(RoleEntity role) {
        this.role = role;
        if (role != null) {
            this.roleName = role.getName();
        }
    }
    public boolean isEnabled() { return enabled; }
    public boolean isAccountNonLocked() { return accountNonLocked; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null) {
            return List.of();
        }
        return role.getAuthorities();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
