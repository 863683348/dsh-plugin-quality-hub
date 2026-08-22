-- CreateTable
CREATE TABLE "low_quality_plugins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "githubUrl" TEXT,
    "synthetic" BOOLEAN NOT NULL DEFAULT true,
    "score" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'D',
    "description" TEXT,
    "flags" JSONB NOT NULL DEFAULT '[]',
    "stars" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "low_quality_plugins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "low_quality_plugins_name_key" ON "low_quality_plugins"("name");

-- CreateIndex
CREATE INDEX "idx_lowq_synthetic" ON "low_quality_plugins"("synthetic");

-- CreateIndex
CREATE INDEX "idx_lowq_grade" ON "low_quality_plugins"("grade");
