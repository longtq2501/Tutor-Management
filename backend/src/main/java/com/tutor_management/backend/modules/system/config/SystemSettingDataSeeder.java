package com.tutor_management.backend.modules.system.config;

import com.tutor_management.backend.modules.system.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SystemSettingDataSeeder implements CommandLineRunner {

    private final SystemSettingService settingService;

    @Override
    public void run(String... args) {
        Map<String, String> defaults = Map.of(
            "SYSTEM_NAME", "Tutor Pro",
            "SUPPORT_EMAIL", "support@tutorpro.edu.vn",
            "MAINTENANCE_MODE", "false",
            "COMMISSION_RATE", "15",
            "MIN_WITHDRAWAL", "500000",
            "SETTLEMENT_CYCLE", "WEEKLY",
            "AUTO_APPROVE_TUTOR", "true",
            "TOKEN_EXPIRATION_DAYS", "7"
        );

        Map<String, String> current = settingService.getAllSettings();
        
        defaults.forEach((key, value) -> {
            if (!current.containsKey(key)) {
                settingService.updateSetting(key, value);
                log.info("Seeded default setting: {} = {}", key, value);
            }
        });
    }
}
