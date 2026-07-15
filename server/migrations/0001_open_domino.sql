ALTER TABLE `users` ADD `username` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `totp_secret` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `totp_enabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);