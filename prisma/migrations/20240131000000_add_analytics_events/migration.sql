-- CreateTable
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "build" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "properties" JSONB,
    "dedupKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique constraint for deduplication)
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsEvent_dedupKey_key" ON "AnalyticsEvent"("dedupKey");

-- CreateIndex (for event filtering)
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_event_idx" ON "AnalyticsEvent"("event");

-- CreateIndex (for session queries)
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex (for time-based queries)
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex (for UTM attribution)
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_utmSource_idx" ON "AnalyticsEvent"("utmSource");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_utmMedium_idx" ON "AnalyticsEvent"("utmMedium");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_utmCampaign_idx" ON "AnalyticsEvent"("utmCampaign");

-- CreateIndex (for build filtering)
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_build_idx" ON "AnalyticsEvent"("build");
