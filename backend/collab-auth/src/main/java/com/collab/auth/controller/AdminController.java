package com.collab.auth.controller;

import com.collab.auth.domain.Role;
import com.collab.auth.domain.User;
import com.collab.auth.repository.RoleRepository;
import com.collab.auth.repository.UserRepository;
import com.collab.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @PostMapping("/assign-role")
    @Transactional
    public ResponseEntity<ApiResponse<String>> assignRole(@RequestParam String username, @RequestParam String roleName) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
        }

        // Standardize role name
        String finalRoleName = roleName.toUpperCase();
        if (!finalRoleName.startsWith("ROLE_")) {
            finalRoleName = "ROLE_" + finalRoleName;
        }

        Optional<Role> roleOpt = roleRepository.findByName(finalRoleName);
        if (roleOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Role not found"));
        }

        User user = userOpt.get();
        Role role = roleOpt.get();

        if (user.getRoles().contains(role)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("User already has this role"));
        }

        user.getRoles().add(role);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(null, "Role " + finalRoleName + " assigned successfully to " + username));
    }
}
