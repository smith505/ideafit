-- CreateTable for Stripe webhook idempotency
CREATE TABLE IF NOT EXISTS "ProcessedStripeEvent" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for mode filtering
CREATE INDEX IF NOT EXISTS "ProcessedStripeEvent_mode_idx" ON "ProcessedStripeEvent"("mode");
