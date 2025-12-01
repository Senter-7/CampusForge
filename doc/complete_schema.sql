-- =====================
-- COMPLETE DATABASE SCHEMA
-- CampusForge Application
-- =====================

-- =====================
-- UNIVERSITIES (Base table - must be created first)
-- =====================
CREATE TABLE universities (
    university_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100)
) ENGINE=InnoDB;

-- =====================
-- USERS AND PROFILES
-- =====================
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image BLOB,
    role ENUM('STUDENT','PROFESSOR','ADMIN') DEFAULT 'STUDENT',  -- Updated to match entity
    university_id BIGINT,  -- Added: matches entity relationship
    -- Teammate profile fields
    major VARCHAR(100),  -- Student's major/field of study
    year ENUM('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate') DEFAULT NULL,  -- Academic year
    availability ENUM('Available', 'Limited', 'Busy') DEFAULT 'Available',  -- Availability status
    hours_per_week VARCHAR(20),  -- Hours available per week (e.g., '10-15 hrs', '8-12 hrs')
    last_seen TIMESTAMP NULL,  -- Last activity timestamp for online/offline status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_u_university FOREIGN KEY (university_id) 
        REFERENCES universities(university_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE skills (
    skill_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE user_skills (
    user_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_us_skill FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE interests (
    interest_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE user_interests (
    user_id BIGINT NOT NULL,
    interest_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, interest_id),
    CONSTRAINT fk_ui_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ui_interest FOREIGN KEY (interest_id) REFERENCES interests(interest_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- PROJECTS AND TEAMS
-- =====================
CREATE TABLE projects (
    project_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    creator_id BIGINT,
    status ENUM('open', 'ongoing', 'completed') DEFAULT 'open',
    members_required INT DEFAULT 5,
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_p_creator FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE project_skills (
    project_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    PRIMARY KEY (project_id, skill_id),
    CONSTRAINT fk_ps_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_skill FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE project_members (
    member_id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- Added: matches ProjectMember entity primary key
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('LEADER', 'MEMBER', 'MENTOR') DEFAULT 'MEMBER',  -- Updated to match ProjectMember entity enum
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_user (project_id, user_id),  -- Unique constraint to prevent duplicate memberships
    CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tasks (
    task_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('TODO', 'IN_PROGRESS', 'DONE') DEFAULT 'TODO',  -- Updated to match Task entity enum
    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',  -- Updated to match Task entity enum
    due_date DATE,
    created_by BIGINT NOT NULL,
    assigned_to BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,  -- Added: matches Task entity field
    CONSTRAINT fk_t_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_t_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_t_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE task_comments (
    comment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tc_task FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE collaboration_requests (
    request_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collabreq_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_collabreq_student FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- COMMUNICATION & NOTIFICATIONS
-- =====================
CREATE TABLE messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    sender_id BIGINT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_m_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_m_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_n_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- PROFESSORS, COURSES, AND RATINGS
-- =====================
CREATE TABLE professors (
    professor_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    email VARCHAR(100) UNIQUE,  -- Added UNIQUE constraint to match entity
    university_id BIGINT,  -- Added: matches entity relationship
    CONSTRAINT fk_p_university FOREIGN KEY (university_id) 
        REFERENCES universities(university_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE courses (
    course_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    professor_id BIGINT,
    description TEXT,
    university_id BIGINT,
    CONSTRAINT fk_r_university FOREIGN KEY (university_id) REFERENCES universities(university_id) ON DELETE CASCADE,
    CONSTRAINT fk_c_professor FOREIGN KEY (professor_id) REFERENCES professors(professor_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE course_details (
    -- Core course info
    course_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    university_id BIGINT NOT NULL,
    professor_id BIGINT,

    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    credits TINYINT,
    description TEXT,
    
    -- Overall stats (retained from your original table)
    rating DECIMAL(3, 1),
    reviews INT UNSIGNED DEFAULT 0,
    difficulty DECIMAL(3, 1),
    workload VARCHAR(50),
    enrolled INT UNSIGNED DEFAULT 0,
    
    -- Flattened 'categories' object (retained)
    rating_content DECIMAL(3, 1),
    rating_teaching DECIMAL(3, 1),
    rating_assignments DECIMAL(3, 1),
    rating_exams DECIMAL(3, 1),
    
    -- Arrays stored as JSON (retained)
    tags JSON,
    prerequisites JSON,
    
    -- Keys & Constraints
    -- Ensures a course code (e.g., 'CS 101') is unique within a specific university
    CONSTRAINT uc_course_code_uni UNIQUE (university_id, code),
    
    -- Links to the universities table
    CONSTRAINT fk_course_detail_university FOREIGN KEY (university_id) 
        REFERENCES universities(university_id) ON DELETE CASCADE,
    
    -- Links to the professors table
    CONSTRAINT fk_course_detail_professor FOREIGN KEY (professor_id) 
        REFERENCES professors(professor_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE ratings (
    rating_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    professor_id BIGINT,
    course_id BIGINT,
    rating_value INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_r_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_r_professor FOREIGN KEY (professor_id) REFERENCES professors(professor_id) ON DELETE CASCADE,
    CONSTRAINT fk_r_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT chk_rating_value CHECK (rating_value BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- =====================
-- REVIEWS TABLE
-- =====================
CREATE TABLE reviews (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    rating_id BIGINT,  -- Optional: link to a rating if review is associated with a rating
    course_detail_id BIGINT,  -- Link to course_details (main course table)
    professor_id BIGINT,  -- Optional: link to professor if reviewing a professor
    title VARCHAR(200),  -- Optional review title
    content TEXT NOT NULL,  -- Review content/comment
    helpful_count INT DEFAULT 0,  -- Number of users who found this review helpful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_rating FOREIGN KEY (rating_id) REFERENCES ratings(rating_id) ON DELETE SET NULL,
    CONSTRAINT fk_rev_course_detail FOREIGN KEY (course_detail_id) REFERENCES course_details(course_id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_professor FOREIGN KEY (professor_id) REFERENCES professors(professor_id) ON DELETE CASCADE,
    -- Ensure at least one of course_detail_id or professor_id is provided
    CONSTRAINT chk_review_target CHECK (
        (course_detail_id IS NOT NULL) OR (professor_id IS NOT NULL)
    )
) ENGINE=InnoDB;

-- Index for faster queries
CREATE INDEX idx_reviews_course_detail ON reviews(course_detail_id);
CREATE INDEX idx_reviews_professor ON reviews(professor_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- =====================
-- ATTACHMENTS
-- =====================
CREATE TABLE attachments (
    attachment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_data MEDIUMBLOB,
    file_path VARCHAR(512),
    uploaded_by BIGINT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_a_project FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_a_user FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================
-- USER RATINGS (Optional - for user-to-user ratings)
-- =====================
CREATE TABLE user_ratings (
    rating_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rated_user_id BIGINT NOT NULL,  -- User being rated
    rater_user_id BIGINT NOT NULL,  -- User giving the rating
    rating_value INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ur_rated_user FOREIGN KEY (rated_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_rater_user FOREIGN KEY (rater_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_user_rating_value CHECK (rating_value BETWEEN 1 AND 5),
    UNIQUE KEY uk_user_rating (rated_user_id, rater_user_id)  -- Prevent duplicate ratings
) ENGINE=InnoDB;

-- Add major field (Student's major/field of study)
