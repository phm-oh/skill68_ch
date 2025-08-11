-- backend/database/03_remaining.sql
-- สร้างตารางที่เหลือทั้งหมด

USE skill68;

-- ตาราง evaluation_topics
CREATE TABLE evaluation_topics (
    id INT AUTO_INCREMENT,
    period_id INT NOT NULL,
    topic_name VARCHAR(200) NOT NULL,
    weight_percentage DECIMAL(5,2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE
);

-- ตาราง evaluation_criteria
CREATE TABLE evaluation_criteria (
    id INT AUTO_INCREMENT,
    topic_id INT NOT NULL,
    criteria_name VARCHAR(300) NOT NULL,
    weight_score DECIMAL(5,2) NOT NULL,
    evaluation_type ENUM('binary', 'scale_1_4', 'custom_options') DEFAULT 'scale_1_4',
    evidence_required BOOLEAN DEFAULT TRUE,
    evidence_types TEXT,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE
);

-- ตาราง evaluation_options
CREATE TABLE evaluation_options (
    id INT AUTO_INCREMENT,
    criteria_id INT NOT NULL,
    option_text VARCHAR(100) NOT NULL,
    option_value DECIMAL(3,2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (criteria_id) REFERENCES evaluation_criteria(id) ON DELETE CASCADE
);

-- ตาราง user_evaluations
CREATE TABLE user_evaluations (
    id INT AUTO_INCREMENT,
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
    evidence_files TEXT,
    evidence_urls TEXT,
    evidence_text TEXT,
    status ENUM('draft', 'submitted', 'evaluated', 'approved') DEFAULT 'draft',
    submitted_at DATETIME DEFAULT NULL,
    evaluated_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (criteria_id) REFERENCES evaluation_criteria(id),
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id),
    UNIQUE KEY unique_evaluation (user_id, criteria_id, period_id)
);

-- ตาราง committee_assignments
CREATE TABLE committee_assignments (
    id INT AUTO_INCREMENT,
    committee_id INT NOT NULL,
    evaluatee_id INT NOT NULL,
    period_id INT NOT NULL,
    role ENUM('chairman', 'member') DEFAULT 'member',
    assigned_by INT NOT NULL,
    assigned_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (committee_id) REFERENCES users(id),
    FOREIGN KEY (evaluatee_id) REFERENCES users(id),
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id),
    UNIQUE KEY unique_assignment (committee_id, evaluatee_id, period_id)
);