-- CreateTable
CREATE TABLE "tutorials" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "order" INTEGER NOT NULL DEFAULT 0,
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "excerptEn" TEXT NOT NULL,
    "excerptZh" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentZh" TEXT NOT NULL,
    "readingMinutes" INTEGER NOT NULL DEFAULT 5,
    "relatedExampleSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "relatedPluginNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tutorials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examples" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "pluginName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "excerptEn" TEXT NOT NULL,
    "excerptZh" TEXT NOT NULL,
    "configEn" TEXT NOT NULL,
    "configZh" TEXT NOT NULL,
    "codeEn" TEXT NOT NULL,
    "codeZh" TEXT NOT NULL,
    "highlightsEn" TEXT NOT NULL,
    "highlightsZh" TEXT NOT NULL,
    "relatedTutorialSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "examples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tutorials_slug_key" ON "tutorials"("slug");

-- CreateIndex
CREATE INDEX "idx_tutorial_status_level" ON "tutorials"("status", "level");

-- CreateIndex
CREATE INDEX "idx_tutorial_status_order" ON "tutorials"("status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "examples_slug_key" ON "examples"("slug");

-- CreateIndex
CREATE INDEX "idx_example_category" ON "examples"("category");

-- CreateIndex
CREATE INDEX "idx_example_plugin" ON "examples"("pluginName");

-- CreateIndex
CREATE INDEX "idx_example_status" ON "examples"("status");
