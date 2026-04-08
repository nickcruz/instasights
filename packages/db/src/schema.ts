import crypto from "node:crypto";

import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePk: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const instagramAccounts = pgTable(
  "instagram_account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    instagramUserId: text("instagramUserId").notNull(),
    username: text("username"),
    accessToken: text("accessToken").notNull(),
    graphApiVersion: text("graphApiVersion").notNull(),
    authAppUrl: text("authAppUrl"),
    tokenIssuedAt: timestamp("tokenIssuedAt", { mode: "date" }),
    linkedAt: timestamp("linkedAt", { mode: "date" }).notNull().defaultNow(),
    lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
    rawProfile: jsonb("rawProfile"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("instagram_account_user_id_idx").on(table.userId),
    instagramUserIdIdx: uniqueIndex("instagram_account_instagram_user_id_idx").on(
      table.instagramUserId,
    ),
  }),
);

export const developerApiKeys = pgTable(
  "developer_api_key",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyPrefix: text("keyPrefix").notNull(),
    secretHash: text("secretHash").notNull(),
    lastUsedAt: timestamp("lastUsedAt", { mode: "date" }),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    keyPrefixIdx: uniqueIndex("developer_api_key_key_prefix_idx").on(
      table.keyPrefix,
    ),
    userIdIdx: index("developer_api_key_user_id_idx").on(table.userId),
  }),
);

export const mcpOAuthClients = pgTable(
  "mcp_oauth_client",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("clientId").notNull(),
    clientSecretHash: text("clientSecretHash"),
    clientName: text("clientName"),
    redirectUris: jsonb("redirectUris").notNull(),
    tokenEndpointAuthMethod: text("tokenEndpointAuthMethod").notNull(),
    grantTypes: jsonb("grantTypes").notNull(),
    responseTypes: jsonb("responseTypes").notNull(),
    scope: text("scope"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: uniqueIndex("mcp_oauth_client_client_id_idx").on(
      table.clientId,
    ),
  }),
);

export const mcpOAuthAuthorizationCodes = pgTable(
  "mcp_oauth_authorization_code",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    codeHash: text("codeHash").notNull(),
    clientId: text("clientId")
      .notNull()
      .references(() => mcpOAuthClients.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redirectUri: text("redirectUri").notNull(),
    scope: text("scope"),
    resource: text("resource"),
    codeChallenge: text("codeChallenge").notNull(),
    codeChallengeMethod: text("codeChallengeMethod").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    consumedAt: timestamp("consumedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    codeHashIdx: uniqueIndex("mcp_oauth_authorization_code_hash_idx").on(
      table.codeHash,
    ),
    clientIdIdx: index("mcp_oauth_authorization_code_client_id_idx").on(
      table.clientId,
    ),
    userIdIdx: index("mcp_oauth_authorization_code_user_id_idx").on(
      table.userId,
    ),
  }),
);

export const mcpOAuthAccessTokens = pgTable(
  "mcp_oauth_access_token",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tokenHash: text("tokenHash").notNull(),
    clientId: text("clientId")
      .notNull()
      .references(() => mcpOAuthClients.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope"),
    resource: text("resource"),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
    lastUsedAt: timestamp("lastUsedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("mcp_oauth_access_token_hash_idx").on(
      table.tokenHash,
    ),
    clientIdIdx: index("mcp_oauth_access_token_client_id_idx").on(
      table.clientId,
    ),
    userIdIdx: index("mcp_oauth_access_token_user_id_idx").on(table.userId),
  }),
);

export const mcpOAuthRefreshTokens = pgTable(
  "mcp_oauth_refresh_token",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tokenHash: text("tokenHash").notNull(),
    clientId: text("clientId")
      .notNull()
      .references(() => mcpOAuthClients.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope"),
    resource: text("resource"),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
    replacedByTokenId: text("replacedByTokenId"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("mcp_oauth_refresh_token_hash_idx").on(
      table.tokenHash,
    ),
    clientIdIdx: index("mcp_oauth_refresh_token_client_id_idx").on(
      table.clientId,
    ),
    userIdIdx: index("mcp_oauth_refresh_token_user_id_idx").on(table.userId),
  }),
);

export const instagramSyncRuns = pgTable("instagram_sync_run", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  instagramAccountId: text("instagramAccountId")
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  triggerType: text("triggerType"),
  workflowRunId: text("workflowRunId"),
  currentStep: text("currentStep"),
  progressPercent: integer("progressPercent"),
  lastHeartbeatAt: timestamp("lastHeartbeatAt", { mode: "date" }),
  statusMessage: text("statusMessage"),
  progress: jsonb("progress"),
  startedAt: timestamp("startedAt", { mode: "date" }).notNull(),
  completedAt: timestamp("completedAt", { mode: "date" }),
  durationSeconds: doublePrecision("durationSeconds"),
  mediaCount: integer("mediaCount"),
  warningCount: integer("warningCount"),
  error: text("error"),
  summary: jsonb("summary"),
  report: jsonb("report"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const instagramAccountSnapshots = pgTable("instagram_account_snapshot", {
  syncRunId: text("syncRunId")
    .primaryKey()
    .references(() => instagramSyncRuns.id, { onDelete: "cascade" }),
  instagramAccountId: text("instagramAccountId")
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: "cascade" }),
  account: jsonb("account").notNull(),
  accountInsights: jsonb("accountInsights").notNull(),
  analysisFacts: jsonb("analysisFacts").notNull(),
  highlights: jsonb("highlights").notNull(),
  warnings: jsonb("warnings").notNull(),
  fetchManifest: jsonb("fetchManifest").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const instagramMediaItems = pgTable("instagram_media_item", {
  id: text("id").primaryKey(),
  instagramAccountId: text("instagramAccountId")
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastSyncRunId: text("lastSyncRunId").references(() => instagramSyncRuns.id, {
    onDelete: "set null",
  }),
  caption: text("caption"),
  commentsCount: integer("commentsCount"),
  likeCount: integer("likeCount"),
  mediaProductType: text("mediaProductType"),
  mediaType: text("mediaType"),
  mediaUrl: text("mediaUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  previewUrl: text("previewUrl"),
  permalink: text("permalink"),
  shortcode: text("shortcode"),
  postedAt: timestamp("postedAt", { mode: "date" }),
  username: text("username"),
  isCommentEnabled: boolean("isCommentEnabled"),
  transcriptStatus: text("transcriptStatus"),
  transcriptText: text("transcriptText"),
  transcriptLanguage: text("transcriptLanguage"),
  transcriptModel: text("transcriptModel"),
  transcriptClipSeconds: integer("transcriptClipSeconds"),
  transcriptError: text("transcriptError"),
  transcriptMetadata: jsonb("transcriptMetadata"),
  transcriptUpdatedAt: timestamp("transcriptUpdatedAt", { mode: "date" }),
  topComments: jsonb("topComments"),
  insights: jsonb("insights"),
  warnings: jsonb("warnings"),
  errors: jsonb("errors"),
  raw: jsonb("raw"),
  syncedAt: timestamp("syncedAt", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const authSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
  authenticatorsTable: authenticators,
};
