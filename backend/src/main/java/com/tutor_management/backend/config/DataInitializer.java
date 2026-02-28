package com.tutor_management.backend.config;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.Permission;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.auth.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * DataInitializer - Tự động tạo tài khoản demo khi start application
 *
 * Features:
 * - Tạo 3 tài khoản mặc định: ADMIN, TUTOR, STUDENT
 * - Chỉ chạy khi database trống (tránh duplicate)
 * - Có thể bật/tắt qua application.yml
 * - Log rõ ràng thông tin accounts
 */
@Component
@RequiredArgsConstructor
@Profile("!test") // Không chạy khi test
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Value("${app.init-data.enabled:true}")
    private boolean initDataEnabled;

    @Value("${app.init-data.default-password:password123}")
    private String defaultPassword;

    @Override
    public void run(String... args) throws Exception {
        if (!initDataEnabled) {
            log.info("Data initialization is disabled");
            return;
        }

        initializeUsers();
    }

    private void initializeUsers() {
        // 1. Initialize Roles & Permissions
        if (roleRepository.count() == 0) {
            log.info("Initializing Roles & Permissions...");
            
            // ADMIN ROLE
            RoleEntity adminRole = RoleEntity.builder()
                    .name("ADMIN")
                    .permissions(java.util.Set.of(Permission.values()))
                    .build();
            roleRepository.save(adminRole);

            // TUTOR ROLE
            RoleEntity tutorRole = RoleEntity.builder()
                    .name("TUTOR")
                    .permissions(java.util.Set.of(
                            Permission.TUTOR_READ,
                            Permission.TUTOR_UPDATE,
                            Permission.STUDENT_READ,
                            Permission.STUDENT_UPDATE
                    ))
                    .build();
            roleRepository.save(tutorRole);

            // STUDENT ROLE
            RoleEntity studentRole = RoleEntity.builder()
                    .name("STUDENT")
                    .permissions(java.util.Set.of(
                            Permission.STUDENT_READ
                    ))
                    .build();
            roleRepository.save(studentRole);
        }

        // 2. Initialize Users
        long userCount = userRepository.count();
        if (userCount > 0) {
            log.info("Database already contains {} users, checking for missing roles...", userCount);
            repairUsersWithMissingRoles();
            return;
        }

        log.info("=================================================");
        log.info("🚀 Starting User Data Initialization...");
        log.info("=================================================");

        try {
            RoleEntity adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            RoleEntity tutorRole = roleRepository.findByName("TUTOR").orElseThrow();
            RoleEntity studentRole = roleRepository.findByName("STUDENT").orElseThrow();

            // Create ADMIN account
            User admin = createUser(
                    "admin@tutormanagement.com",
                    "Quản Trị Viên",
                    adminRole
            );

            // Create TUTOR account
            User tutor = createUser(
                    "tutor@tutormanagement.com",
                    "Giáo Viên Dạy Kèm",
                    tutorRole
            );

            // Create STUDENT account
            User student = createUser(
                    "student@tutormanagement.com",
                    "Học Sinh",
                    studentRole
            );

            // Save all users
            userRepository.save(admin);
            userRepository.save(tutor);
            userRepository.save(student);

            log.info("✅ Successfully created 3 demo accounts!");
            printAccountInfo();

        } catch (Exception e) {
            log.error("❌ Error initializing users: {}", e.getMessage(), e);
        }
    }

    private void repairUsersWithMissingRoles() {
        List<User> allUsers = userRepository.findAll();
        RoleEntity adminRole = roleRepository.findByName("ADMIN").orElse(null);
        RoleEntity tutorRole = roleRepository.findByName("TUTOR").orElse(null);
        RoleEntity studentRole = roleRepository.findByName("STUDENT").orElse(null);

        // Repair users with NULL role
        List<User> usersWithNoRole = allUsers.stream()
                .filter(u -> u.getRole() == null)
                .toList();

        if (!usersWithNoRole.isEmpty()) {
            log.info("🔧 Found {} users with missing roles. Attempting repair...", usersWithNoRole.size());
            for (User user : usersWithNoRole) {
                repairSingleUser(user, adminRole, tutorRole, studentRole);
            }
        }
    }

    private void repairSingleUser(User user, RoleEntity adminRole, RoleEntity tutorRole, RoleEntity studentRole) {
        if (user.getEmail().contains("admin") && adminRole != null) {
            user.setRole(adminRole);
        } else if (user.getEmail().contains("tutor") && tutorRole != null) {
            user.setRole(tutorRole);
        } else if (studentRole != null) {
            user.setRole(studentRole);
        }
        userRepository.save(user);
        log.info("✅ Repaired user: {} with role: {}", user.getEmail(), user.getRole().getName());
    }

    private User createUser(String email, String fullName, RoleEntity role) {
        return User.builder()
                .email(email)
                .password(passwordEncoder.encode(defaultPassword))
                .fullName(fullName)
                .role(role)
                .enabled(true)
                .accountNonLocked(true)
                .build();
    }

    private void printAccountInfo() {
        log.info("=================================================");
        log.info("📋 Demo Accounts Information:");
        log.info("=================================================");
        log.info("");
        log.info("👨‍💼 ADMIN (Quản trị viên):");
        log.info("   Email:    admin@tutormanagement.com");
        log.info("   Password: {}", defaultPassword);
        log.info("   Role:     ADMIN");
        log.info("");
        log.info("👨‍🏫 TUTOR (Gia sư):");
        log.info("   Email:    tutor@tutormanagement.com");
        log.info("   Password: {}", defaultPassword);
        log.info("   Role:     TUTOR");
        log.info("");
        log.info("👨‍🎓 STUDENT (Học sinh):");
        log.info("   Email:    student@tutormanagement.com");
        log.info("   Password: {}", defaultPassword);
        log.info("   Role:     STUDENT");
        log.info("");
        log.info("=================================================");
        log.info("⚠️  IMPORTANT: Change passwords in production!");
        log.info("=================================================");
    }
}
