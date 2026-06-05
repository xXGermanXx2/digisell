CREATE TABLE IF NOT EXISTS `user_warnings` (
  `id` SERIAL PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `admin_id` BIGINT UNSIGNED NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `reason` TEXT NOT NULL,
  `is_dismissed` BOOLEAN NOT NULL DEFAULT FALSE,
  `dismissed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `user_warnings_user_idx` (`user_id`),
  KEY `user_warnings_admin_idx` (`admin_id`),
  KEY `user_warnings_dismissed_idx` (`user_id`, `is_dismissed`),
  KEY `user_warnings_created_idx` (`created_at`),
  CONSTRAINT `user_warnings_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_warnings_admin_fk` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
);
