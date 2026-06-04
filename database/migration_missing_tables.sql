-- =====================================================
-- Migration: Fehlende Tabellen für DigiSell
-- Datum: 2026-06-05
-- =====================================================

-- shops Tabelle
CREATE TABLE IF NOT EXISTS `shops` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `logo` varchar(500) DEFAULT NULL,
  `banner` varchar(500) DEFAULT NULL,
  `category` varchar(100) DEFAULT 'general',
  `currency` varchar(3) NOT NULL DEFAULT 'EUR',
  `status` enum('active','suspended','pending') NOT NULL DEFAULT 'active',
  `total_revenue` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_orders` int NOT NULL DEFAULT '0',
  `total_products` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shop_slug_idx` (`slug`),
  KEY `shop_owner_idx` (`owner_id`),
  KEY `shop_status_idx` (`status`),
  CONSTRAINT `shops_owner_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- reports Tabelle
CREATE TABLE IF NOT EXISTS `reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reporter_id` bigint unsigned DEFAULT NULL,
  `reporter_email` varchar(255) DEFAULT NULL,
  `target_type` enum('user','shop','product','review') NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `reason` enum('spam','fraud','inappropriate','fake','other') NOT NULL,
  `description` text,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `resolved_by` bigint unsigned DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `report_target_idx` (`target_type`,`target_id`),
  KEY `report_status_idx` (`status`),
  CONSTRAINT `reports_reporter_id_fk` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reports_resolved_by_fk` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- login_logs Tabelle
CREATE TABLE IF NOT EXISTS `login_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `success` tinyint(1) NOT NULL DEFAULT '1',
  `failure_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `login_logs_user_idx` (`user_id`),
  KEY `login_logs_created_idx` (`created_at`),
  CONSTRAINT `login_logs_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- admin_roles Tabelle
CREATE TABLE IF NOT EXISTS `admin_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `permissions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_roles_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_admin_roles Pivot-Tabelle
CREATE TABLE IF NOT EXISTS `user_admin_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `assigned_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_role_unique` (`user_id`,`role_id`),
  KEY `user_admin_roles_role_idx` (`role_id`),
  CONSTRAINT `user_admin_roles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_admin_roles_role_fk` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_admin_roles_assigned_fk` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- moderation_logs Tabelle
CREATE TABLE IF NOT EXISTS `moderation_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `moderator_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `target_type` varchar(50) DEFAULT NULL,
  `target_id` bigint unsigned DEFAULT NULL,
  `reason` text,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mod_logs_moderator_idx` (`moderator_id`),
  KEY `mod_logs_created_idx` (`created_at`),
  CONSTRAINT `moderation_logs_moderator_fk` FOREIGN KEY (`moderator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- seller_id Spalte zu orders hinzufügen
ALTER TABLE `orders` ADD COLUMN `seller_id` bigint unsigned DEFAULT NULL AFTER `customer_id`;
ALTER TABLE `orders` ADD KEY `orders_seller_idx` (`seller_id`);

-- created_by Spalte zu coupons hinzufügen
ALTER TABLE `coupons` ADD COLUMN `created_by` bigint unsigned DEFAULT NULL AFTER `id`;

-- seller_id Spalte zu tickets hinzufügen
ALTER TABLE `tickets` ADD COLUMN `seller_id` bigint unsigned DEFAULT NULL AFTER `customer_id`;
