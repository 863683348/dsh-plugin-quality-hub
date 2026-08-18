-- CreateTable
CREATE TABLE "plugins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "githubUrl" TEXT NOT NULL,
    "npmName" TEXT,
    "description" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'F',
    "maintenance" INTEGER NOT NULL DEFAULT 0,
    "docs" INTEGER NOT NULL DEFAULT 0,
    "npm" INTEGER NOT NULL DEFAULT 0,
    "ecosystem" INTEGER NOT NULL DEFAULT 0,
    "flags" JSONB NOT NULL DEFAULT '[]',
    "stars" INTEGER NOT NULL DEFAULT 0,
    "lastPush" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_logs" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_logs" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'running',
    "pluginsFetched" INTEGER NOT NULL DEFAULT 0,
    "pluginsUpdated" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plugins_name_key" ON "plugins"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plugins_githubUrl_key" ON "plugins"("githubUrl");

-- CreateIndex
CREATE INDEX "idx_score" ON "plugins"("score");

-- CreateIndex
CREATE INDEX "idx_grade" ON "plugins"("grade");

-- CreateIndex
CREATE INDEX "idx_last_push" ON "plugins"("lastPush");

-- CreateIndex
CREATE INDEX "idx_plugin_score" ON "score_logs"("pluginId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_refresh_status_time" ON "refresh_logs"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "score_logs" ADD CONSTRAINT "score_logs_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
