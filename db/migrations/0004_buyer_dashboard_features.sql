-- Buyer dashboard feature tables: favorites, notifications, chargebacks

CREATE TABLE IF NOT EXISTS `user_favorites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('product','shop') NOT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `shop_id` bigint unsigned DEFAULT NULL,
  `notify_price_changes` boolean NOT NULL DEFAULT false,
  `notify_shop_updates` boolean NOT NULL DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_favorites_unique_product` (`user_id`,`product_id`),
  UNIQUE KEY `user_favorites_unique_shop` (`user_id`,`shop_id`),
  KEY `user_favorites_user_type_idx` (`user_id`,`type`),
  KEY `user_favorites_product_idx` (`product_id`),
  KEY `user_favorites_shop_idx` (`shop_id`),
  CONSTRAINT `user_favorites_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_favorites_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_favorites_shop_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('order','download','ticket','refund','promo','system','security','price_change') NOT NULL DEFAULT 'system',
  `channel` enum('in_app','email') NOT NULL DEFAULT 'in_app',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `is_read` boolean NOT NULL DEFAULT false,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_notifications_user_read_idx` (`user_id`,`is_read`),
  KEY `user_notifications_type_idx` (`type`),
  KEY `user_notifications_created_idx` (`created_at`),
  CONSTRAINT `user_notifications_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `chargebacks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `provider` enum('stripe','paypal','crypto','system') NOT NULL DEFAULT 'system',
  `status` enum('none','in_review','won','lost','accepted','closed') NOT NULL DEFAULT 'in_review',
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'EUR',
  `reason` varchar(255) DEFAULT NULL,
  `external_id` varchar(255) DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chargebacks_order_idx` (`order_id`),
  KEY `chargebacks_status_idx` (`status`),
  CONSTRAINT `chargebacks_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
);
