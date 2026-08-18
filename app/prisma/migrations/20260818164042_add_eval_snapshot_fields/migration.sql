-- Add evaluation snapshot fields to plugins (v1.1 change-triggered re-evaluation)
ALTER TABLE "plugins" ADD COLUMN "npmVersion" TEXT;
ALTER TABLE "plugins" ADD COLUMN "evalSource" TEXT NOT NULL DEFAULT 'seed';
ALTER TABLE "plugins" ADD COLUMN "lastEvalAt" TIMESTAMP(3);
ALTER TABLE "plugins" ADD COLUMN "evalMeta" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "idx_eval_source" ON "plugins"("evalSource");
