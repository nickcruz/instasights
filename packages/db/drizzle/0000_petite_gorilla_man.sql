CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "instagram_account_snapshot" (
	"syncRunId" text PRIMARY KEY NOT NULL,
	"instagramAccountId" text NOT NULL,
	"account" jsonb NOT NULL,
	"accountInsights" jsonb NOT NULL,
	"analysisFacts" jsonb NOT NULL,
	"highlights" jsonb NOT NULL,
	"warnings" jsonb NOT NULL,
	"fetchManifest" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"instagramUserId" text NOT NULL,
	"username" text,
	"accessToken" text NOT NULL,
	"graphApiVersion" text NOT NULL,
	"authAppUrl" text,
	"tokenIssuedAt" timestamp,
	"linkedAt" timestamp DEFAULT now() NOT NULL,
	"lastSyncedAt" timestamp,
	"rawProfile" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_media_item" (
	"id" text PRIMARY KEY NOT NULL,
	"instagramAccountId" text NOT NULL,
	"userId" text NOT NULL,
	"lastSyncRunId" text,
	"caption" text,
	"commentsCount" integer,
	"likeCount" integer,
	"mediaProductType" text,
	"mediaType" text,
	"mediaUrl" text,
	"thumbnailUrl" text,
	"previewUrl" text,
	"permalink" text,
	"shortcode" text,
	"postedAt" timestamp,
	"username" text,
	"isCommentEnabled" boolean,
	"topComments" jsonb,
	"insights" jsonb,
	"warnings" jsonb,
	"errors" jsonb,
	"raw" jsonb,
	"syncedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_sync_run" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"instagramAccountId" text NOT NULL,
	"status" text NOT NULL,
	"triggerType" text,
	"workflowRunId" text,
	"currentStep" text,
	"progressPercent" integer,
	"lastHeartbeatAt" timestamp,
	"statusMessage" text,
	"startedAt" timestamp NOT NULL,
	"completedAt" timestamp,
	"durationSeconds" double precision,
	"mediaCount" integer,
	"warningCount" integer,
	"error" text,
	"summary" jsonb,
	"report" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_account_snapshot" ADD CONSTRAINT "instagram_account_snapshot_syncRunId_instagram_sync_run_id_fk" FOREIGN KEY ("syncRunId") REFERENCES "public"."instagram_sync_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_account_snapshot" ADD CONSTRAINT "instagram_account_snapshot_instagramAccountId_instagram_account_id_fk" FOREIGN KEY ("instagramAccountId") REFERENCES "public"."instagram_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_account" ADD CONSTRAINT "instagram_account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD CONSTRAINT "instagram_media_item_instagramAccountId_instagram_account_id_fk" FOREIGN KEY ("instagramAccountId") REFERENCES "public"."instagram_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD CONSTRAINT "instagram_media_item_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD CONSTRAINT "instagram_media_item_lastSyncRunId_instagram_sync_run_id_fk" FOREIGN KEY ("lastSyncRunId") REFERENCES "public"."instagram_sync_run"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_sync_run" ADD CONSTRAINT "instagram_sync_run_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_sync_run" ADD CONSTRAINT "instagram_sync_run_instagramAccountId_instagram_account_id_fk" FOREIGN KEY ("instagramAccountId") REFERENCES "public"."instagram_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_account_user_id_idx" ON "instagram_account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_account_instagram_user_id_idx" ON "instagram_account" USING btree ("instagramUserId");