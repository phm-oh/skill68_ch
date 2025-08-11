-- backend/database/schema.sql
-- สร้างตารางทั้งหมดสำหรับระบบประเมินบุคลากร

-- ใช้ฐานข้อมูล skill68
USE skill68;

-- 1. ตาราง users (ผู้ใช้งาน)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('hr', 'evaluatee', 'committee') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. ตาราง evaluation_periods (รอบการประเมิน)
CREATE TABLE evaluation_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. ตาราง evaluation_topics (หัวข้อการประเมิน)
CREATE TABLE evaluation_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    topic_name VARCHAR(200) NOT NULL,
    weight_percentage DECIMAL(5,2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE
);

-- 4. ตาราง evaluation_criteria (ตัวชี้วัด)
CREATE TABLE evaluation_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    criteria_name VARCHAR(300) NOT NULL,
    weight_score DECIMAL(5,2) NOT NULL,
    evaluation_type ENUM('binary', 'scale_1_4', 'custom_options') DEFAULT 'scale_1_4',
    evidence_required BOOLEAN DEFAULT TRUE,
    evidence_types JSON,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE
);

-- 5. ตาราง evaluation_options (ตัวเลือกการประเมิน)
CREATE TABLE evaluation_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    criteria_id INT NOT NULL,
    option_text VARCHAR(100) NOT NULL,
    option_value DECIMAL(3,2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (criteria_id) REFERENCES evaluation_criteria(id) ON DELETE CASCADE
);

-- 6. ตาราง user_evaluations (การประเมิน)
CREATE TABLE user_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    criteria_id INT NOT NULL,
    period_id INT NOT NULL,
    self_selected_option_id INT,
    self_score DECIMAL(5,2),
    self_comment TEXT,
    committee_selected_option_id INT,
    committee_score DECIMAL(5,2),
    committee_comment TEXT,
    committee_evaluated_by INT,
    evidence_files JSON,
    evidence_urls JSON,
    evidence_text TEXT,
    status ENUM('draft', 'submitted', 'evaluated', 'approved') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    evaluated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (criteria_id) REFERENCES evaluation_criteria(id),
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id),
    UNIQUE KEY unique_evaluation (user_id, criteria_id, period_id)
);

-- 7. ตาราง committee_assignments (มอบหมายกรรมการ)
CREATE TABLE committee_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    committee_id INT NOT NULL,
    evaluatee_id INT NOT NULL,
    period_id INT NOT NULL,
    role ENUM('chairman', 'member') DEFAULT 'member',
    assigned_by INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (committee_id) REFERENCES users(id),
    FOREIGN KEY (evaluatee_id) REFERENCES users(id),
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id),
    UNIQUE KEY unique_assignment (committee_id, evaluatee_id, period_id)
);

-- สร้าง Index เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_periods_active ON evaluation_periods(is_active);
CREATE INDEX idx_evaluations_user ON user_evaluations(user_id);
CREATE INDEX idx_evaluations_status ON user_evaluations(status);
CREATE INDEX idx_assignments_committee ON committee_assignments(committee_id);
CREATE INDEX idx_assignments_evaluatee ON committee_assignments(evaluatee_id);

-- Insert ข้อมูลทดสอบ
-- รหัสผ่านที่เข้ารหัสแล้วสำหรับ "password"
INSERT INTO users (username, password, role, full_name, email, department, position) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hr', 'ผู้ดูแลระบบ', 'admin@example.com', 'IT', 'System Admin'),
('john.doe', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'evaluatee', 'นายจอห์น โด', 'john@example.com', 'การตลาด', 'Marketing Manager'),
('jane.smith', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'committee', 'นางเจน สมิธ', 'jane@example.com', 'HR', 'HR Director');