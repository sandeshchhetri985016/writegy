package com.writegy.repository;

import com.writegy.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Clean repository interface
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
