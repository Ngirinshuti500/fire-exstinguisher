-- Fire Extinguisher Management System - schema.sql
-- Run: MySQL 8+  (adjust database name if needed)

CREATE DATABASE IF NOT EXISTS fire_extinguisher_mgmt;
USE fire_extinguisher_mgmt;

-- ----------------------------
-- USERS
-- ----------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Inspector', 'Auditor') NOT NULL DEFAULT 'Inspector',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- LOCATIONS
-- ----------------------------
DROP TABLE IF EXISTS locations;
CREATE TABLE locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_name VARCHAR(255) NOT NULL,
  floor VARCHAR(50) NOT NULL,
  specific_zone VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_location (building_name, floor, specific_zone)
);

-- ----------------------------
-- FIRE EXTINGUISHERS
-- ----------------------------
DROP TABLE IF EXISTS extinguishers;
CREATE TABLE extinguishers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(100) NOT NULL,
  capacity_kg DECIMAL(10,2) NULL,
  location_id INT NULL,

  status ENUM('Active', 'Under Maintenance', 'Inactive') NOT NULL DEFAULT 'Active',

  manufacture_date DATE NULL,
  next_service_date DATE NULL,
  hydrostatic_test_due DATE NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ext_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- ----------------------------
-- INSPECTIONS (routine checks)
-- ----------------------------
DROP TABLE IF EXISTS inspections;
CREATE TABLE inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  extinguisher_id INT NOT NULL,
  inspector_id INT NOT NULL,

  pressure_gauge VARCHAR(50) NOT NULL,
  nozzle_and_hose VARCHAR(50) NOT NULL,

  tamper_seal_intact TINYINT NOT NULL,
  physical_signs_rust_dent TINYINT NOT NULL,
  is_obstructed TINYINT NOT NULL,
  signage_visible TINYINT NOT NULL,

  status_passed TINYINT NOT NULL,
  comments TEXT NULL,

  triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_insp_ext
    FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_insp_inspector
    FOREIGN KEY (inspector_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- ----------------------------
-- ALERTS (generated on failed inspections)
-- ----------------------------
DROP TABLE IF EXISTS alerts;
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  extinguisher_id INT NOT NULL,
  alert_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,

  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,

  CONSTRAINT fk_alert_ext
    FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ----------------------------
-- MAINTENANCE LOGS
-- ----------------------------
DROP TABLE IF EXISTS maintenance_logs;
CREATE TABLE maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  extinguisher_id INT NOT NULL,
  technician_id INT NOT NULL,
  maintenance_type VARCHAR(100) NOT NULL,

  service_date DATE NOT NULL,
  service_provider VARCHAR(255) NOT NULL,

  cost DECIMAL(12,2) NULL,
  details TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_maint_ext
    FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_maint_technician
    FOREIGN KEY (technician_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- Seed optional: Admin user placeholder
-- NOTE: You must generate password_hash separately (bcrypt). This is left empty intentionally.

