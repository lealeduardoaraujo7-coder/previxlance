-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "color" TEXT,
    "showInNav" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- Data migration: seed categories from the DISTINCT values already in the DB
-- (ESPORTES included). Market/Event values are lowercased below to match slugs.
INSERT INTO "Category" ("id","slug","name","imageUrl","color","showInNav","order") VALUES
  ('cat_politica','politica','Política',NULL,'#dbeafe',1,0),
  ('cat_futebol','futebol','Futebol',NULL,'#dcfce7',1,1),
  ('cat_economia','economia','Economia',NULL,'#fef3c7',1,2),
  ('cat_entretenimento','entretenimento','Entretenimento',NULL,'#f3e8ff',1,3),
  ('cat_outros','outros','Outros',NULL,'#f3f4f6',1,4),
  ('cat_esportes','esportes','Esportes',NULL,'#e0f2fe',0,5);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "collection" TEXT,
    "category" TEXT NOT NULL DEFAULT 'outros',
    "closesAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_category_fkey" FOREIGN KEY ("category") REFERENCES "Category" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("category", "closesAt", "collection", "createdAt", "description", "featured", "id", "imageUrl", "slug", "status", "title") SELECT lower("category"), "closesAt", "collection", "createdAt", "description", "featured", "id", "imageUrl", "slug", "status", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_featured_category_idx" ON "Event"("featured", "category");
CREATE TABLE "new_Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'outros',
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
    CONSTRAINT "Market_category_fkey" FOREIGN KEY ("category") REFERENCES "Category" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Market_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Market" ("category", "closesAt", "createdAt", "description", "eventId", "featured", "featuredOrder", "featuredUntil", "id", "imageUrl", "proposedByEmail", "proposedByName", "resolution", "resolvedAt", "shortLabel", "status", "title", "totalPool", "type", "updatedAt") SELECT lower("category"), "closesAt", "createdAt", "description", "eventId", "featured", "featuredOrder", "featuredUntil", "id", "imageUrl", "proposedByEmail", "proposedByName", "resolution", "resolvedAt", "shortLabel", "status", "title", "totalPool", "type", "updatedAt" FROM "Market";
DROP TABLE "Market";
ALTER TABLE "new_Market" RENAME TO "Market";
CREATE INDEX "Market_featured_featuredOrder_idx" ON "Market"("featured", "featuredOrder");
CREATE INDEX "Market_eventId_idx" ON "Market"("eventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_showInNav_order_idx" ON "Category"("showInNav", "order");
