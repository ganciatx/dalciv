CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitation_organizationId_idx` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `member_organizationId_idx` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_userId_idx` ON `member` (`user_id`);--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`created_at` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_uidx` ON `organization` (`slug`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `assumptions` (
	`assumption_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`frame_id` integer NOT NULL,
	`assumption_code` text(10),
	`assumption_text` text NOT NULL,
	`validation_status` text(20),
	`validation_date` text,
	`validation_notes` text,
	FOREIGN KEY (`frame_id`) REFERENCES `problem_frames`(`frame_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assumptions_frame_idx` ON `assumptions` (`frame_id`);--> statement-breakpoint
CREATE TABLE `barriers` (
	`barrier_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`frame_id` integer NOT NULL,
	`barrier_category` text(50),
	`barrier_text` text NOT NULL,
	`impact_percentage` real,
	`severity` text(20),
	`evidence_count` integer DEFAULT 0,
	FOREIGN KEY (`frame_id`) REFERENCES `problem_frames`(`frame_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `barriers_frame_idx` ON `barriers` (`frame_id`);--> statement-breakpoint
CREATE TABLE `customer_feedback` (
	`feedback_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`response_date` text,
	`question_type` text(100),
	`comment_text` text NOT NULL,
	`theme` text(100),
	`sentiment` text(20),
	`group_tag` text(50),
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customer_feedback_product_idx` ON `customer_feedback` (`product_id`);--> statement-breakpoint
CREATE TABLE `desired_outcomes` (
	`outcome_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`frame_id` integer NOT NULL,
	`outcome_text` text NOT NULL,
	`priority_rank` integer,
	`jtbd_category` text(50),
	FOREIGN KEY (`frame_id`) REFERENCES `problem_frames`(`frame_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `desired_outcomes_frame_idx` ON `desired_outcomes` (`frame_id`);--> statement-breakpoint
CREATE TABLE `emotional_impacts` (
	`emotion_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`frame_id` integer NOT NULL,
	`emotion_text` text NOT NULL,
	`emotion_category` text(30),
	`intensity` integer,
	FOREIGN KEY (`frame_id`) REFERENCES `problem_frames`(`frame_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `emotional_impacts_frame_idx` ON `emotional_impacts` (`frame_id`);--> statement-breakpoint
CREATE TABLE `feedback_barrier_link` (
	`link_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feedback_id` integer NOT NULL,
	`barrier_id` integer NOT NULL,
	`relevance_score` real,
	FOREIGN KEY (`feedback_id`) REFERENCES `customer_feedback`(`feedback_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`barrier_id`) REFERENCES `barriers`(`barrier_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `fbl_feedback_idx` ON `feedback_barrier_link` (`feedback_id`);--> statement-breakpoint
CREATE INDEX `fbl_barrier_idx` ON `feedback_barrier_link` (`barrier_id`);--> statement-breakpoint
CREATE TABLE `frame_constraints` (
	`constraint_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`frame_id` integer NOT NULL,
	`constraint_type` text(30),
	`constraint_text` text NOT NULL,
	`is_modifiable` integer DEFAULT true,
	FOREIGN KEY (`frame_id`) REFERENCES `problem_frames`(`frame_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `frame_constraints_frame_idx` ON `frame_constraints` (`frame_id`);--> statement-breakpoint
CREATE TABLE `hypotheses` (
	`hypothesis_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`frame_id` integer NOT NULL,
	`barrier_id` integer NOT NULL,
	`hypothesis_title` text(200) NOT NULL,
	`if_statement` text,
	`then_statement` text,
	`because_statement` text,
	`priority` integer,
	`effort` text(20),
	`impact` text(20),
	`confidence` text(20),
	`status` text(20) DEFAULT 'Proposed',
	FOREIGN KEY (`frame_id`) REFERENCES `problem_frames`(`frame_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`barrier_id`) REFERENCES `barriers`(`barrier_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hypotheses_frame_idx` ON `hypotheses` (`frame_id`);--> statement-breakpoint
CREATE INDEX `hypotheses_barrier_idx` ON `hypotheses` (`barrier_id`);--> statement-breakpoint
CREATE TABLE `hypothesis_metrics` (
	`metric_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hypothesis_id` integer NOT NULL,
	`metric_name` text(100) NOT NULL,
	`baseline_value` text(50),
	`target_value` text(50),
	`measurement_method` text,
	`actual_value` text(50),
	FOREIGN KEY (`hypothesis_id`) REFERENCES `hypotheses`(`hypothesis_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hypothesis_metrics_hypothesis_idx` ON `hypothesis_metrics` (`hypothesis_id`);--> statement-breakpoint
CREATE TABLE `pain_points` (
	`pain_point_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`persona_id` integer NOT NULL,
	`pain_point_text` text NOT NULL,
	`severity` integer NOT NULL,
	`frequency` text(20),
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`persona_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pain_points_persona_idx` ON `pain_points` (`persona_id`);--> statement-breakpoint
CREATE TABLE `personas` (
	`persona_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`persona_name` text(100) NOT NULL,
	`description` text,
	`tech_savviness` text(20),
	`customer_segment` text(50),
	`created_date` text,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `personas_org_idx` ON `personas` (`organization_id`);--> statement-breakpoint
CREATE TABLE `problem_frame_versions` (
	`version_row_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`frame_id` integer NOT NULL,
	`version_number` integer NOT NULL,
	`label` text(200),
	`snapshot_json` text NOT NULL,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`frame_id`) REFERENCES `problem_frames`(`frame_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `frame_versions_frame_idx` ON `problem_frame_versions` (`frame_id`);--> statement-breakpoint
CREATE TABLE `problem_frames` (
	`frame_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`persona_id` integer NOT NULL,
	`frame_title` text(200) NOT NULL,
	`problem_statement` text,
	`status` text(20) DEFAULT 'Draft' NOT NULL,
	`created_date` text,
	`created_by_user_id` text,
	`last_updated` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`persona_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `problem_frames_product_idx` ON `problem_frames` (`product_id`);--> statement-breakpoint
CREATE INDEX `problem_frames_persona_idx` ON `problem_frames` (`persona_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`product_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`product_name` text(100) NOT NULL,
	`product_code` text(20) NOT NULL,
	`product_category` text(50),
	`launch_date` text,
	`status` text(20) DEFAULT 'Active' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_org_idx` ON `products` (`organization_id`);--> statement-breakpoint
CREATE TABLE `root_causes` (
	`cause_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barrier_id` integer NOT NULL,
	`cause_text` text NOT NULL,
	`cause_type` text(30),
	`validated` integer DEFAULT false,
	`validation_method` text(100),
	FOREIGN KEY (`barrier_id`) REFERENCES `barriers`(`barrier_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `root_causes_barrier_idx` ON `root_causes` (`barrier_id`);