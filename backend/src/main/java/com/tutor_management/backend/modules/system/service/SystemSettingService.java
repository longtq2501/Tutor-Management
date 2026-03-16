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

/**
 * Service for managing system settings.
 * Provides methods to retrieve and update system configurations stored in the database.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SystemSettingService {

    private final SystemSettingRepository repository;

    /**
     * Retrieves the value of a system setting by its key.
     *
     * @param key          The key of the setting to retrieve.
     * @param defaultValue The default value to return if the setting is not found.
     * @return The value of the setting, or the default value if not found.
     */
    public String getSetting(String key, String defaultValue) {
        return repository.findByKey(key)
                .map(SystemSetting::getValue)
                .orElse(defaultValue);
    }

    /**
     * Retrieves the boolean value of a system setting by its key.
     *
     * @param key          The key of the setting to retrieve.
     * @param defaultValue The default boolean value to return if the setting is not found or cannot be parsed.
     * @return The boolean value of the setting, or the default value if not found or invalid.
     */
    public boolean getBoolean(String key, boolean defaultValue) {
        String value = getSetting(key, null);
        return value != null ? Boolean.parseBoolean(value) : defaultValue;
    }

    /**
     * Retrieves the integer value of a system setting by its key.
     *
     * @param key          The key of the setting to retrieve.
     * @param defaultValue The default integer value to return if the setting is not found or cannot be parsed.
     * @return The integer value of the setting, or the default value if not found or invalid.
     */
    public int getInt(String key, int defaultValue) {
        String value = getSetting(key, null);
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Updates the value of a system setting. If the setting does not exist, it will be created.
     *
     * @param key   The key of the setting to update.
     * @param value The new value for the setting.
     */
    public void updateSetting(String key, String value) {
        SystemSetting setting = repository.findByKey(key)
                .orElse(SystemSetting.builder().key(key).build());
        setting.setValue(value);
        repository.save(setting);
    }

    /**
     * Retrieves all system settings as a map of key-value pairs.
     *
     * @return A map containing all system settings, where the key is the setting's key and the value is the setting's value.
     */
    public Map<String, String> getAllSettings() {
        List<SystemSetting> all = repository.findAll();
        Map<String, String> map = new HashMap<>();
        for (SystemSetting s : all) {
            map.put(s.getKey(), s.getValue());
        }
        return map;
    }

    /**
     * Updates multiple system settings based on the provided key-value pairs. Each setting will be updated or created if it does not exist.
     *
     * @param settings A map containing setting keys and their new values to be updated.
     */
    @Transactional
    public void updateAll(Map<String, String> settings) {
        settings.forEach(this::updateSetting);
    }
}
