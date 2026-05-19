package com.collab.auth.service;

import com.collab.auth.dto.AuthResponse;
import com.collab.auth.dto.LoginRequest;
import com.collab.auth.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
