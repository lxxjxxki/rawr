package com.rawr.config;

import com.rawr.auth.JwtUtil;
import com.rawr.auth.OAuth2UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.core.endpoint.PkceParameterNames;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final OAuth2UserService oAuth2UserService;
    private final String frontendUrl;
    private final ClientRegistrationRepository clientRegistrationRepository;

    public SecurityConfig(JwtUtil jwtUtil, OAuth2UserService oAuth2UserService,
                          @Value("${rawr.frontend-url}") String frontendUrl,
                          ClientRegistrationRepository clientRegistrationRepository) {
        this.jwtUtil = jwtUtil;
        this.oAuth2UserService = oAuth2UserService;
        this.frontendUrl = frontendUrl;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/articles/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/articles/{articleId}/comments").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/subscriptions").permitAll()
                .requestMatchers("/api/subscriptions/unsubscribe").permitAll()
                .requestMatchers("/oauth2/**", "/login/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(endpoint -> endpoint
                    .authorizationRequestResolver(kakaoNoPkceResolver()))
                .userInfoEndpoint(u -> u.userService(oAuth2UserService))
                .successHandler((request, response, authentication) -> {
                    var principal = (org.springframework.security.oauth2.core.user.OAuth2User)
                            authentication.getPrincipal();
                    String jwt = (String) principal.getAttributes().get("jwt");
                    response.sendRedirect(frontendUrl + "/auth/callback?token=" + jwt);
                })
            )
            .addFilterBefore(new JwtAuthFilter(jwtUtil),
                    UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private OAuth2AuthorizationRequestResolver kakaoNoPkceResolver() {
        DefaultOAuth2AuthorizationRequestResolver delegate =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository, "/oauth2/authorization");
        return new OAuth2AuthorizationRequestResolver() {
            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
                return stripPkceForKakao(delegate.resolve(request));
            }
            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
                return stripPkceForKakao(delegate.resolve(request, clientRegistrationId));
            }
            private OAuth2AuthorizationRequest stripPkceForKakao(OAuth2AuthorizationRequest req) {
                if (req == null) return null;
                if (!"kakao".equals(req.getAttributes().get(OAuth2ParameterNames.REGISTRATION_ID))) return req;
                Map<String, Object> params = new HashMap<>(req.getAdditionalParameters());
                params.remove(PkceParameterNames.CODE_CHALLENGE);
                params.remove(PkceParameterNames.CODE_CHALLENGE_METHOD);
                Map<String, Object> attrs = new HashMap<>(req.getAttributes());
                attrs.remove(PkceParameterNames.CODE_VERIFIER);
                return OAuth2AuthorizationRequest.from(req)
                        .additionalParameters(params)
                        .attributes(attrs)
                        .build();
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendUrl, "https://www.rawr.co.kr", "https://rawr.co.kr"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
