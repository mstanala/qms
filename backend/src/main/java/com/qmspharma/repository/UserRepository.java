package com.qmspharma.repository;

import com.qmspharma.model.entity.User;
import com.qmspharma.model.enums.UserType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeId(String employeeId);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);

    @Query("SELECT u FROM User u WHERE u.isActive = true AND " +
           "(:search IS NULL OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:departmentId IS NULL OR u.department.id = :departmentId) AND " +
           "(:userType IS NULL OR u.userType = :userType)")
    Page<User> findUsersFiltered(@Param("search") String search, @Param("departmentId") UUID departmentId, @Param("userType") UserType userType, Pageable pageable);
}
