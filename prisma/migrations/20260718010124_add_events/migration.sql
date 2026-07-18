-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "collection" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OUTROS',
    "closesAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OUTROS',
    "type" TEXT NOT NULL DEFAULT 'BINARY',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "totalPool" INTEGER NOT NULL DEFAULT 0,
    "closesAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "proposedByName" TEXT,
    "proposedByEmail" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "featuredUntil" DATETIME,
    "eventId" TEXT,
    "shortLabel" TEXT,
    CONSTRAINT "Market_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Market" ("category", "closesAt", "createdAt", "description", "featured", "featuredOrder", "featuredUntil", "id", "imageUrl", "proposedByEmail", "proposedByName", "resolution", "resolvedAt", "status", "title", "totalPool", "type", "updatedAt") SELECT "category", "closesAt", "createdAt", "description", "featured", "featuredOrder", "featuredUntil", "id", "imageUrl", "proposedByEmail", "proposedByName", "resolution", "resolvedAt", "status", "title", "totalPool", "type", "updatedAt" FROM "Market";
DROP TABLE "Market";
ALTER TABLE "new_Market" RENAME TO "Market";
CREATE INDEX "Market_featured_featuredOrder_idx" ON "Market"("featured", "featuredOrder");
CREATE INDEX "Market_eventId_idx" ON "Market"("eventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_featured_category_idx" ON "Event"("featured", "category");
