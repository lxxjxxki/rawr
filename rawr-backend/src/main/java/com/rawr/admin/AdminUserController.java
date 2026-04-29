package com.rawr.admin;

import com.rawr.user.Role;
import com.rawr.user.User;
import com.rawr.user.UserRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('OWNER')")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<AdminUserResponse> list() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    public record RoleChangeRequest(@NotNull Role role) {}

    @PatchMapping("/{id}/role")
    @Transactional
    public AdminUserResponse changeRole(@PathVariable UUID id, @RequestBody RoleChangeRequest body) {
        if (body.role() == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot promote to OWNER");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change OWNER's role");
        }
        user.setRole(body.role());
        return AdminUserResponse.from(user);
    }
}
