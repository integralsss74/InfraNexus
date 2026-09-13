CREATE TABLE `importFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(512) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sizeBytes` int NOT NULL,
	`rowsDetected` int NOT NULL DEFAULT 0,
	`validationStatus` enum('validated','needs_mapping','rejected') NOT NULL,
	`importedBy` varchar(128) NOT NULL,
	`importCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `importFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthlyProjectUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(32) NOT NULL,
	`observationMonth` varchar(16) NOT NULL,
	`physicalProgress` decimal(5,2),
	`financialProgress` decimal(5,2),
	`monthlyExpenditure` decimal(18,2),
	`cumulativeExpenditure` decimal(18,2),
	`plannedProgress` decimal(5,2),
	`milestonesCompleted` int DEFAULT 0,
	`milestonesDelayed` int DEFAULT 0,
	`riskLevel` varchar(32),
	`issuesReported` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthlyProjectUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(32) NOT NULL,
	`predictionDate` timestamp NOT NULL DEFAULT (now()),
	`costOverrunProbability` decimal(5,2),
	`predictedCostOverrunPercentage` decimal(7,2),
	`delayProbability` decimal(5,2),
	`predictedDelayMonths` decimal(7,2),
	`implementationRisk` decimal(5,2),
	`overallRiskScore` decimal(5,2),
	`riskCategory` varchar(32),
	`modelVersion` varchar(64) NOT NULL,
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(32) NOT NULL,
	`projectName` varchar(255) NOT NULL,
	`ministry` varchar(255) NOT NULL,
	`department` varchar(255),
	`sector` varchar(128) NOT NULL,
	`state` varchar(128) NOT NULL,
	`district` varchar(128),
	`implementingAgency` varchar(255),
	`approvedCost` decimal(18,2) NOT NULL,
	`revisedCost` decimal(18,2),
	`expenditure` decimal(18,2),
	`physicalProgress` decimal(5,2),
	`financialProgress` decimal(5,2),
	`projectStatus` varchar(64),
	`numberOfMilestones` int DEFAULT 0,
	`milestonesDelayed` int DEFAULT 0,
	`numberOfExtensions` int DEFAULT 0,
	`landAcquisitionStatus` varchar(64),
	`tenderStatus` varchar(64),
	`environmentalClearanceStatus` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_projectId_unique` UNIQUE(`projectId`)
);
