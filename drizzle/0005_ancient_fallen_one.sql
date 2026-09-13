CREATE TABLE `portfolioBriefs` (
	`id` varchar(64) NOT NULL,
	`ownerUserId` int NOT NULL,
	`projectId` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`evidenceJson` text NOT NULL,
	`status` enum('generated','approved','superseded') NOT NULL DEFAULT 'generated',
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioBriefs_id` PRIMARY KEY(`id`)
);
