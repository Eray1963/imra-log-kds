-- Create database
CREATE DATABASE IF NOT EXISTS imra_kds;
USE imra_kds;

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate VARCHAR(20) NOT NULL,
    status ENUM('available', 'maintenance') DEFAULT 'available',
    capacity INT NOT NULL
);

-- Stocks table
CREATE TABLE IF NOT EXISTS stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    minimumLevel INT NOT NULL
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    currentUsage INT DEFAULT 0
);