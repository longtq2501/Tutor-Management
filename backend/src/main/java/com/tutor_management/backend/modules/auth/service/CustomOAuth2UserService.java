package com.tutor_management.backend.modules.auth.service;

import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.RoleRepository;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpSession;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final com.tutor_management.backend.modules.tutor.service.TutorService tutorService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        return processOAuth2User(oAuth2User);
    }

    private OAuth2User processOAuth2User(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            
            // ✅ CRITICAL: Prevent students from logging in via Google
            if ("STUDENT".equals(user.getRole().getName())) {
                log.warn("Blocked Google login attempt for student account: {}", email);
                throw new OAuth2AuthenticationException("Học sinh vui lòng đăng nhập bằng tài khoản được cấp từ Gia sư.");
            }
            
            updateExistingUser(user, name, picture);
        } else {
            String roleName = "TUTOR";
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpSession session = attr.getRequest().getSession(false);
            if (session != null) {
                String roleHint = (String) session.getAttribute("OAUTH2_ROLE_HINT");
                if (roleHint != null) {
                    roleName = roleHint.toUpperCase();
                    session.removeAttribute("OAUTH2_ROLE_HINT");
                }
            }

            final String finalRoleName = roleName;
            RoleEntity role = roleRepository.findByName(finalRoleName)
                    .orElseThrow(() -> new OAuth2AuthenticationException("Role not found: " + finalRoleName));
            
            user = registerNewUser(email, name, picture, role);
        }

        // ✅ CRITICAL: Centralized Tutor profile provisioning
        tutorService.ensureTutorProfile(user);

        return oAuth2User;
    }

    private User registerNewUser(String email, String name, String picture, RoleEntity role) {
        User user = User.builder()
                .email(email)
                .fullName(name != null ? name : email.split("@")[0])
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(role)
                .avatarUrl(picture)
                .enabled(true)
                .accountNonLocked(true)
                .build();
        
        log.info("Registering new Google user: {}", email);
        return userRepository.save(user);
    }

    private void updateExistingUser(User user, String name, String picture) {
        boolean updated = false;
        if (name != null && !name.equals(user.getFullName())) {
            user.setFullName(name);
            updated = true;
        }
        if (picture != null && !picture.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(picture);
            updated = true;
        }
        
        if (updated) {
            userRepository.save(user);
            log.info("Updated information for existing user: {}", user.getEmail());
        }
    }
}
