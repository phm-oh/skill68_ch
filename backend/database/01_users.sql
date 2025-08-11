-- backend/database/01_users.sql
-- สร้างตาราง users อย่างเดียวก่อน

USE skill68;

CREATE TABLE users (
    id INT AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('hr', 'evaluatee', 'committee') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_username (username),
    UNIQUE KEY unique_email (email)
);

-- ใส่ข้อมูลทดสอบ (รหัสผ่าน = "password")
INSERT INTO users (username, password, role, full_name, email, department, position) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hr', 'ผู้ดูแลระบบ', 'admin@example.com', 'IT', 'System Admin'),
('john.doe', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'evaluatee', 'นายจอห์น โด', 'john@example.com', 'การตลาด', 'Marketing Manager'),
('jane.smith', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'committee', 'นางเจน สมิธ', 'jane@example.com', 'HR', 'HR Director');