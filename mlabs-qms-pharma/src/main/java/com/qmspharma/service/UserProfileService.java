package com.qmspharma.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qmspharma.model.dto.request.ChangePasswordRequest;
import com.qmspharma.model.dto.request.UpdateUserRequest;
import com.qmspharma.model.dto.request.UpdateUserPreferencesRequest;
import com.qmspharma.model.dto.response.UserActivityResponse;
import com.qmspharma.model.dto.response.UserPreferencesResponse;
import com.qmspharma.model.dto.response.UserResponse;
import com.qmspharma.model.entity.SystemConfiguration;
import com.qmspharma.model.enums.ConfigType;
import com.qmspharma.repository.AuditTrailRepository;
import com.qmspharma.repository.SystemConfigurationRepository;
import com.qmspharma.repository.UserLoginAuditRepository;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private static final String PREF_MODULE = "USER_PREFS";
    private final UserService userService;
    private final SystemConfigurationRepository systemConfigurationRepository;
    private final UserLoginAuditRepository userLoginAuditRepository;
    private final AuditTrailRepository auditTrailRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public UserResponse getProfile() {
        return userService.getUser(currentUserProvider.getCurrentUserId());
    }

    @Transactional
    public UserResponse updateProfile(UpdateUserRequest request) {
        request.setUserType(null);
        request.setDepartmentId(null);
        request.setPlantSiteId(null);
        request.setManagerId(null);
        return userService.updateUser(currentUserProvider.getCurrentUserId(), request);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        userService.changePassword(currentUserProvider.getCurrentUserId(), request);
    }

    @Transactional(readOnly = true)
    public UserPreferencesResponse getPreferences() {
        return readPreferences();
    }

    @Transactional
    public UserPreferencesResponse updatePreferences(UpdateUserPreferencesRequest preferences) {
        UserPreferencesResponse normalized = normalize(preferences);
        String key = preferenceKey();
        SystemConfiguration config = systemConfigurationRepository
                .findByConfigKeyAndModuleAndPlantSiteIsNull(key, PREF_MODULE)
                .orElseGet(SystemConfiguration::new);
        config.setConfigKey(key);
        config.setModule(PREF_MODULE);
        config.setConfigType(ConfigType.JSON);
        config.setDescription("User preferences for " + currentUserProvider.getCurrentUser().getUsername());
        config.setUpdatedBy(currentUserProvider.getCurrentUser());
        try {
            config.setConfigValue(objectMapper.writeValueAsString(normalized));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unable to serialize user preferences", ex);
        }
        systemConfigurationRepository.save(config);
        return normalized;
    }

    @Transactional(readOnly = true)
    public List<UserActivityResponse> getActivity(int size) {
        var pageable = PageRequest.of(0, Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "timestamp"));
        UUID userId = currentUserProvider.getCurrentUserId();
        List<UserActivityResponse> activity = new ArrayList<>();

        auditTrailRepository.findByUserId(userId, pageable).forEach(entry -> activity.add(UserActivityResponse.builder()
                .id(entry.getId().toString())
                .type("AUDIT")
                .action(entry.getAction())
                .description(entry.getComments())
                .recordType(entry.getRecordType())
                .recordId(entry.getRecordId() != null ? entry.getRecordId().toString() : null)
                .recordNumber(entry.getRecordNumber())
                .ipAddress(entry.getIpAddress())
                .timestamp(entry.getTimestamp())
                .build()));

        var loginPageable = PageRequest.of(0, Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "loginTimestamp"));
        userLoginAuditRepository.findByUserId(userId, loginPageable).forEach(entry -> activity.add(UserActivityResponse.builder()
                .id(entry.getId().toString())
                .type("LOGIN")
                .action("LOGIN")
                .description(entry.getFailureReason())
                .status(entry.getLoginStatus().name())
                .ipAddress(entry.getIpAddress())
                .timestamp(entry.getLoginTimestamp())
                .build()));

        activity.sort(Comparator.comparing(UserActivityResponse::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())));
        return activity.stream().limit(Math.max(1, Math.min(size, 100))).toList();
    }

    private UserPreferencesResponse readPreferences() {
        return systemConfigurationRepository
                .findByConfigKeyAndModuleAndPlantSiteIsNull(preferenceKey(), PREF_MODULE)
                .map(SystemConfiguration::getConfigValue)
                .map(this::parsePreferences)
                .orElse(defaultPreferences());
    }

    private UserPreferencesResponse parsePreferences(String raw) {
        try {
            Map<String, Object> values = objectMapper.readValue(raw, new TypeReference<>() {});
            return normalize(UserPreferencesResponse.builder()
                    .emailNotifications(asBoolean(values.get("emailNotifications")))
                    .taskReminders(asBoolean(values.get("taskReminders")))
                    .compactView(asBoolean(values.get("compactView")))
                    .landingPage(values.get("landingPage") != null ? String.valueOf(values.get("landingPage")) : null)
                    .build());
        } catch (Exception ex) {
            return defaultPreferences();
        }
    }

    private UserPreferencesResponse normalize(UpdateUserPreferencesRequest preferences) {
        UserPreferencesResponse defaults = defaultPreferences();
        return UserPreferencesResponse.builder()
                .emailNotifications(preferences.getEmailNotifications() != null ? preferences.getEmailNotifications() : defaults.getEmailNotifications())
                .taskReminders(preferences.getTaskReminders() != null ? preferences.getTaskReminders() : defaults.getTaskReminders())
                .compactView(preferences.getCompactView() != null ? preferences.getCompactView() : defaults.getCompactView())
                .landingPage(preferences.getLandingPage() != null && !preferences.getLandingPage().isBlank()
                        ? preferences.getLandingPage()
                        : defaults.getLandingPage())
                .build();
    }

    private UserPreferencesResponse normalize(UserPreferencesResponse preferences) {
        UpdateUserPreferencesRequest request = new UpdateUserPreferencesRequest();
        request.setEmailNotifications(preferences.getEmailNotifications());
        request.setTaskReminders(preferences.getTaskReminders());
        request.setCompactView(preferences.getCompactView());
        request.setLandingPage(preferences.getLandingPage());
        return normalize(request);
    }

    private Boolean asBoolean(Object value) {
        if (value instanceof Boolean bool) return bool;
        if (value == null) return null;
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private UserPreferencesResponse defaultPreferences() {
        return UserPreferencesResponse.builder()
                .emailNotifications(true)
                .taskReminders(true)
                .compactView(false)
                .landingPage("/dashboard")
                .build();
    }

    private String preferenceKey() {
        return "user.preferences." + currentUserProvider.getCurrentUserId();
    }
}
