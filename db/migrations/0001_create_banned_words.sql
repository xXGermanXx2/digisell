CREATE TABLE IF NOT EXISTS `banned_words` (
  `id` SERIAL PRIMARY KEY,
  `word` VARCHAR(255) NOT NULL,
  `match_mode` ENUM('exact','contains') NOT NULL DEFAULT 'contains',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `reason` TEXT,
  `created_by` BIGINT UNSIGNED,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `banned_words_word_idx` (`word`),
  KEY `banned_words_active_idx` (`is_active`)
);
