-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "shares" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Position_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Position_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MarketOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "optionId" TEXT,
    "outcome" TEXT,
    "side" TEXT NOT NULL DEFAULT 'BUY',
    "amount" INTEGER NOT NULL,
    "shares" REAL NOT NULL DEFAULT 0,
    "price" INTEGER NOT NULL DEFAULT 0,
    "payout" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MarketOption" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bet" ("amount", "createdAt", "id", "marketId", "optionId", "outcome", "payout", "userId") SELECT "amount", "createdAt", "id", "marketId", "optionId", "outcome", "payout", "userId" FROM "Bet";
DROP TABLE "Bet";
ALTER TABLE "new_Bet" RENAME TO "Bet";
CREATE TABLE "new_Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'outros',
    "type" TEXT NOT NULL DEFAULT 'BINARY',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "totalPool" INTEGER NOT NULL DEFAULT 0,
    "liquidity" REAL NOT NULL DEFAULT 100,
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
    "shortImageUrl" TEXT,
    CONSTRAINT "Market_category_fkey" FOREIGN KEY ("category") REFERENCES "Category" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Market_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Market" ("category", "closesAt", "createdAt", "description", "eventId", "featured", "featuredOrder", "featuredUntil", "id", "imageUrl", "proposedByEmail", "proposedByName", "resolution", "resolvedAt", "shortImageUrl", "shortLabel", "status", "title", "totalPool", "type", "updatedAt") SELECT "category", "closesAt", "createdAt", "description", "eventId", "featured", "featuredOrder", "featuredUntil", "id", "imageUrl", "proposedByEmail", "proposedByName", "resolution", "resolvedAt", "shortImageUrl", "shortLabel", "status", "title", "totalPool", "type", "updatedAt" FROM "Market";
DROP TABLE "Market";
ALTER TABLE "new_Market" RENAME TO "Market";
CREATE INDEX "Market_featured_featuredOrder_idx" ON "Market"("featured", "featuredOrder");
CREATE INDEX "Market_eventId_idx" ON "Market"("eventId");
CREATE TABLE "new_MarketOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "totalBet" INTEGER NOT NULL DEFAULT 0,
    "shares" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "MarketOption_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MarketOption" ("id", "label", "marketId", "totalBet") SELECT "id", "label", "marketId", "totalBet" FROM "MarketOption";
DROP TABLE "MarketOption";
ALTER TABLE "new_MarketOption" RENAME TO "MarketOption";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Position_marketId_idx" ON "Position"("marketId");

-- CreateIndex
CREATE INDEX "Position_userId_idx" ON "Position"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_optionId_key" ON "Position"("userId", "optionId");
