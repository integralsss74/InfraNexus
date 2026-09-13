CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`targetType` varchar(96) NOT NULL,
	`targetId` varchar(128),
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`criticalEnabled` boolean NOT NULL DEFAULT true,
	`highEnabled` boolean NOT NULL DEFAULT true,
	`digestMode` enum('instant','daily','weekly') NOT NULL DEFAULT 'daily',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
