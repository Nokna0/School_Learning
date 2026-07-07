CREATE TABLE `english_words` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`word` varchar(100) NOT NULL,
	`meaning` text NOT NULL,
	`definition` text,
	`pronunciation` varchar(255),
	`part_of_speech` varchar(50),
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`example` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `english_words_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` text NOT NULL,
	`file_key` varchar(255) NOT NULL,
	`file_size` int NOT NULL,
	`subject` enum('math','english','chemistry') NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `materials_file_key_unique` UNIQUE(`file_key`)
);
--> statement-breakpoint
CREATE TABLE `math_formulas` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`expression` text NOT NULL,
	`description` text,
	`category` varchar(100),
	`color` varchar(7) DEFAULT '#FF6B6B',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `math_formulas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_answers` (
	`id` varchar(36) NOT NULL,
	`quiz_session_id` varchar(36) NOT NULL,
	`question_id` varchar(36) NOT NULL,
	`user_answer` text NOT NULL,
	`correct_answer` text NOT NULL,
	`is_correct` boolean NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`material_id` varchar(36),
	`subject` enum('math','english','chemistry') NOT NULL,
	`question_count` int NOT NULL,
	`score` decimal(5,2) NOT NULL,
	`completed_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_records` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`material_id` varchar(36),
	`subject` enum('math','english','chemistry') NOT NULL,
	`duration` int NOT NULL,
	`score` decimal(5,2),
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `study_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_statistics` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`total_study_minutes` int DEFAULT 0,
	`total_quizzes_completed` int DEFAULT 0,
	`average_quiz_score` decimal(5,2) DEFAULT '0',
	`math_minutes` int DEFAULT 0,
	`english_minutes` int DEFAULT 0,
	`chemistry_minutes` int DEFAULT 0,
	`last_studied_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `study_statistics_id` PRIMARY KEY(`id`),
	CONSTRAINT `study_statistics_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`profile_image` varchar(500),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `english_words` (`user_id`);--> statement-breakpoint
CREATE INDEX `word_idx` ON `english_words` (`word`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `materials` (`user_id`);--> statement-breakpoint
CREATE INDEX `subject_idx` ON `materials` (`subject`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `math_formulas` (`user_id`);--> statement-breakpoint
CREATE INDEX `quiz_session_id_idx` ON `quiz_answers` (`quiz_session_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `quiz_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `subject_idx` ON `quiz_sessions` (`subject`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `study_records` (`user_id`);--> statement-breakpoint
CREATE INDEX `subject_idx` ON `study_records` (`subject`);--> statement-breakpoint
CREATE INDEX `material_id_idx` ON `study_records` (`material_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `study_statistics` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);