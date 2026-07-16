CREATE TABLE `learning_plan_assumptions` (
	`assumption_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`learning_plan_id` integer NOT NULL,
	`assumption_type` text(10) DEFAULT 'CA' NOT NULL,
	`assumption_text` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`learning_plan_id`) REFERENCES `learning_plans`(`learning_plan_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lp_assumptions_plan_idx` ON `learning_plan_assumptions` (`learning_plan_id`);--> statement-breakpoint
CREATE TABLE `learning_plan_experiments` (
	`experiment_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assumption_id` integer NOT NULL,
	`mode` text(20) DEFAULT 'Go Learn' NOT NULL,
	`hypothesis` text,
	`experiment` text,
	`timeline` text(100),
	`measure` text,
	`results` text,
	`driver_group` text(100),
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`assumption_id`) REFERENCES `learning_plan_assumptions`(`assumption_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lp_experiments_assumption_idx` ON `learning_plan_experiments` (`assumption_id`);--> statement-breakpoint
CREATE TABLE `learning_plans` (
	`learning_plan_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`product_id` integer,
	`plan_name` text(200) NOT NULL,
	`timeframe` text(50),
	`ideal_state` text,
	`client_problem` text,
	`status` text(20) DEFAULT 'Active' NOT NULL,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`last_updated` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `learning_plans_org_idx` ON `learning_plans` (`organization_id`);--> statement-breakpoint
CREATE INDEX `learning_plans_product_idx` ON `learning_plans` (`product_id`);