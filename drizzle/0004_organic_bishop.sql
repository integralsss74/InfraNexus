CREATE TABLE `acceptableUseAcknowledgements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`policyVersion` varchar(32) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `acceptableUseAcknowledgements_id` PRIMARY KEY(`id`),
	CONSTRAINT `acceptableUseAcknowledgements_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `authorizedCoordinates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(32) NOT NULL,
	`latitude` decimal(9,6) NOT NULL,
	`longitude` decimal(9,6) NOT NULL,
	`precision` enum('district','project') NOT NULL,
	`sourceName` varchar(255) NOT NULL,
	`authorityReference` varchar(255) NOT NULL,
	`consentConfirmed` boolean NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`supersededAt` timestamp,
	CONSTRAINT `authorizedCoordinates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interventionCases` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(32) NOT NULL,
	`status` enum('New','Awaiting agency','Response received','Under review','Intervention approved','Closed') NOT NULL DEFAULT 'New',
	`ownerUserId` int,
	`dueAt` timestamp,
	`agencyResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interventionCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interventionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interventionId` varchar(64) NOT NULL,
	`actorUserId` int NOT NULL,
	`actorRole` varchar(16) NOT NULL,
	`action` varchar(96) NOT NULL,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interventionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedReviewFilters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`teamName` varchar(128),
	`visibility` enum('private','team') NOT NULL DEFAULT 'private',
	`filterState` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedReviewFilters_id` PRIMARY KEY(`id`)
);
