CREATE TABLE IF NOT EXISTS `shop_buyer_accounts` (
  `id` serial AUTO_INCREMENT PRIMARY KEY,
  `shop_id` bigint unsigned NOT NULL,
  `email` varchar(320) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255),
  `status` enum('active','blocked','pending') NOT NULL DEFAULT 'active',
  `email_verified` boolean NOT NULL DEFAULT false,
  `last_sign_in_at` timestamp NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `shop_buyer_accounts_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE cascade,
  UNIQUE KEY `shop_buyer_shop_email_unique` (`shop_id`, `email`),
  KEY `shop_buyer_shop_idx` (`shop_id`),
  KEY `shop_buyer_email_idx` (`email`),
  KEY `shop_buyer_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `shop_buyer_sessions` (
  `id` serial AUTO_INCREMENT PRIMARY KEY,
  `account_id` bigint unsigned NOT NULL,
  `shop_id` bigint unsigned NOT NULL,
  `token` varchar(128) NOT NULL UNIQUE,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `shop_buyer_sessions_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `shop_buyer_accounts`(`id`) ON DELETE cascade,
  CONSTRAINT `shop_buyer_sessions_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE cascade,
  KEY `shop_buyer_session_token_idx` (`token`),
  KEY `shop_buyer_session_account_idx` (`account_id`),
  KEY `shop_buyer_session_shop_idx` (`shop_id`)
);
