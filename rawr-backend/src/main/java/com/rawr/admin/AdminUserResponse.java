package com.rawr.admin;

import com.rawr.user.Role;
import com.rawr.user.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String username,
        String profileImage,
        Role role,
        LocalDateTime createdAt
) {
    public static AdminUserResponse from(User u) {
        return new AdminUserResponse(
                u.getId(),
                u.getEmail(),
                u.getUsername(),
                u.getProfileImage(),
                u.getRole(),
                u.getCreatedAt()
        );
    }
}
