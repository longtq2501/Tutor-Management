package com.tutor_management.backend.config;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.Role;
import com.tutor_management.backend.modules.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
        // Check if users already exist
        long userCount = userRepository.count();
        if (userCount > 0) {
            log.info("Database already contains {} users, skipping initialization", userCount);
            return;
        }

        log.info("=================================================");
        log.info("🚀 Starting Data Initialization...");
        log.info("=================================================");

        try {
            // Create ADMIN account
            User admin = createUser(
                    "admin@tutormanagement.com",
                    "Quản Trị Viên",
                    Role.ADMIN
            );

            // Create TUTOR account
            User tutor = createUser(
                    "tutor@tutormanagement.com",
                    "Giáo Viên Dạy Kèm",
                    Role.TUTOR
            );

            // Create STUDENT account
            User student = createUser(
                    "student@tutormanagement.com",
                    "Học Sinh",
                    Role.STUDENT
            );

            // Save all users
            userRepository.save(admin);
            userRepository.save(tutor);
            userRepository.save(student);

            log.info("✅ Successfully created 3 demo accounts!");
            printAccountInfo();

        } catch (Exception e) {
            log.error("❌ Error initializing data: {}", e.getMessage(), e);
        }
    }

    private User createUser(String email, String fullName, Role role) {
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
