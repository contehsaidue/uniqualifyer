-- CreateTable
CREATE TABLE "public"."recommendation_caches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courses" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_caches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_caches_userId_key" ON "public"."recommendation_caches"("userId");

-- AddForeignKey
ALTER TABLE "public"."recommendation_caches" ADD CONSTRAINT "recommendation_caches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
