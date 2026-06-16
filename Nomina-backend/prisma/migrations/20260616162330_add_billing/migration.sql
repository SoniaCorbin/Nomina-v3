-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "monthlyLimit" INTEGER NOT NULL DEFAULT 1000,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "tokenUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_clerkUserId_key" ON "Subscription"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_plan_idx" ON "Subscription"("plan");

-- CreateIndex
CREATE INDEX "Subscription_periodEnd_idx" ON "Subscription"("periodEnd");

-- CreateIndex
CREATE INDEX "UsageLog_subscriptionId_createdAt_idx" ON "UsageLog"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageLog_createdAt_idx" ON "UsageLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
