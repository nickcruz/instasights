CREATE TABLE "mcp_oauth_access_token" (
	"id" text PRIMARY KEY NOT NULL,
	"tokenHash" text NOT NULL,
	"clientId" text NOT NULL,
	"userId" text NOT NULL,
	"scope" text,
	"resource" text,
	"expiresAt" timestamp NOT NULL,
	"revokedAt" timestamp,
	"lastUsedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_authorization_code" (
	"id" text PRIMARY KEY NOT NULL,
	"codeHash" text NOT NULL,
	"clientId" text NOT NULL,
	"userId" text NOT NULL,
	"redirectUri" text NOT NULL,
	"scope" text,
	"resource" text,
	"codeChallenge" text NOT NULL,
	"codeChallengeMethod" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"consumedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_client" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"clientSecretHash" text,
	"clientName" text,
	"redirectUris" jsonb NOT NULL,
	"tokenEndpointAuthMethod" text NOT NULL,
	"grantTypes" jsonb NOT NULL,
	"responseTypes" jsonb NOT NULL,
	"scope" text,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_refresh_token" (
	"id" text PRIMARY KEY NOT NULL,
	"tokenHash" text NOT NULL,
	"clientId" text NOT NULL,
	"userId" text NOT NULL,
	"scope" text,
	"resource" text,
	"expiresAt" timestamp NOT NULL,
	"revokedAt" timestamp,
	"replacedByTokenId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mcp_oauth_access_token" ADD CONSTRAINT "mcp_oauth_access_token_clientId_mcp_oauth_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."mcp_oauth_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_access_token" ADD CONSTRAINT "mcp_oauth_access_token_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_authorization_code" ADD CONSTRAINT "mcp_oauth_authorization_code_clientId_mcp_oauth_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."mcp_oauth_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_authorization_code" ADD CONSTRAINT "mcp_oauth_authorization_code_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_refresh_token" ADD CONSTRAINT "mcp_oauth_refresh_token_clientId_mcp_oauth_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."mcp_oauth_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_refresh_token" ADD CONSTRAINT "mcp_oauth_refresh_token_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_access_token_hash_idx" ON "mcp_oauth_access_token" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "mcp_oauth_access_token_client_id_idx" ON "mcp_oauth_access_token" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "mcp_oauth_access_token_user_id_idx" ON "mcp_oauth_access_token" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_authorization_code_hash_idx" ON "mcp_oauth_authorization_code" USING btree ("codeHash");--> statement-breakpoint
CREATE INDEX "mcp_oauth_authorization_code_client_id_idx" ON "mcp_oauth_authorization_code" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "mcp_oauth_authorization_code_user_id_idx" ON "mcp_oauth_authorization_code" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_client_client_id_idx" ON "mcp_oauth_client" USING btree ("clientId");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_refresh_token_hash_idx" ON "mcp_oauth_refresh_token" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "mcp_oauth_refresh_token_client_id_idx" ON "mcp_oauth_refresh_token" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "mcp_oauth_refresh_token_user_id_idx" ON "mcp_oauth_refresh_token" USING btree ("userId");