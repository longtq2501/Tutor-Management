package com.tutor_management.backend.modules.auth.service;

import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.RoleRepository;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
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

/**
 * CustomOAuth2UserService is responsible for processing OAuth2 user information during authentication.
 * It handles both new user registration and existing user updates based on the email provided by the OAuth2 provider.
 * The service also manages role assignment based on hints provided via session or cookies, ensuring a seamless user experience.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final com.tutor_management.backend.modules.tutor.service.TutorService tutorService;
    private final PasswordEncoder passwordEncoder;

    // The loadUser method is overridden to process the OAuth2 user information after it is retrieved from the provider.
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        return processOAuth2User(oAuth2User);
    }

    // The processOAuth2User method extracts user information from the OAuth2User object, checks if the user already exists in the database, and either updates the existing user or registers a new one. It also handles role assignment based on hints provided via session or cookies.
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
            updateExistingUser(user, name, picture);
        } else {
            String roleName = "TUTOR";
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            jakarta.servlet.http.HttpServletRequest request = attr.getRequest();
            
            // 1. Try reading from Session (Local/Classic)
            HttpSession session = request.getSession(false);
            if (session != null) {
                String roleHint = (String) session.getAttribute("OAUTH2_ROLE_HINT");
                if (roleHint != null) {
                    roleName = roleHint.toUpperCase();
                    session.removeAttribute("OAUTH2_ROLE_HINT");
                }
            }

            // 2. Try reading from Cookie (Production/Railway Fix)
            if ("TUTOR".equals(roleName) && request.getCookies() != null) {
                for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                    if ("OAUTH2_ROLE_HINT".equals(cookie.getName())) {
                        roleName = cookie.getValue().toUpperCase();
                        
                        // Clear the cookie immediately
                        jakarta.servlet.http.HttpServletResponse response = attr.getResponse();
                        if (response != null) {
                            String clearCookie = "OAUTH2_ROLE_HINT=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None";
                            response.addHeader("Set-Cookie", clearCookie);
                        }
                        break;
                    }
                }
            }

            final String finalRoleName = roleName;
            RoleEntity role = roleRepository.findByName(finalRoleName)
                    .orElseThrow(() -> new OAuth2AuthenticationException("Role not found: " + finalRoleName));
            
            user = registerNewUser(email, name, picture, role);

            // CRITICAL: Provision Tutor profile ONLY for new TUTOR registrations
            if ("TUTOR".equals(user.getRole().getName())) {
                tutorService.ensureTutorProfile(user);
            }
        }

        return oAuth2User;
    }

    // The registerNewUser method creates a new User entity based on the information provided by the OAuth2 provider and saves it to the database. It also assigns a default role to the user based on the hints provided via session or cookies.
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

    // The updateExistingUser method updates the existing user's information (name and picture) if it has changed since the last login. It checks for changes to avoid unnecessary database updates and logs any updates made to the user's information.
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
