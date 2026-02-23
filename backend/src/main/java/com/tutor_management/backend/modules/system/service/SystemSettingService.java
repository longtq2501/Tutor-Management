package com.tutor_management.backend.modules.system.service;

import com.tutor_management.backend.modules.system.entity.SystemSetting;
import com.tutor_management.backend.modules.system.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SystemSettingService {

    private final SystemSettingRepository repository;

    public String getSetting(String key, String defaultValue) {
        return repository.findByKey(key)
                .map(SystemSetting::getValue)
                .orElse(defaultValue);
    }

    public boolean getBoolean(String key, boolean defaultValue) {
        String value = getSetting(key, null);
        return value != null ? Boolean.parseBoolean(value) : defaultValue;
    }

    public int getInt(String key, int defaultValue) {
        String value = getSetting(key, null);
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public void updateSetting(String key, String value) {
        SystemSetting setting = repository.findByKey(key)
                .orElse(SystemSetting.builder().key(key).build());
        setting.setValue(value);
        repository.save(setting);
    }

    public Map<String, String> getAllSettings() {
        List<SystemSetting> all = repository.findAll();
        Map<String, String> map = new HashMap<>();
        for (SystemSetting s : all) {
            map.put(s.getKey(), s.getValue());
        }
        return map;
    }

    @Transactional
    public void updateAll(Map<String, String> settings) {
        settings.forEach(this::updateSetting);
    }
}
