ALTER TABLE "instagram_account_snapshot"
ADD COLUMN "analysisReports" jsonb;

ALTER TABLE "instagram_media_item"
ADD COLUMN "analysis" jsonb;

CREATE INDEX "instagram_media_item_last_sync_run_id_idx"
ON "instagram_media_item" USING btree ("lastSyncRunId");
