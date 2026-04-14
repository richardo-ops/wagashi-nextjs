import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting tenant migration...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "companies" (
      "id" TEXT PRIMARY KEY,
      "companyId" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await prisma.$executeRawUnsafe(`
    INSERT INTO "companies" ("id", "companyId", "name", "createdAt", "updatedAt")
    VALUES ('demo-company', 'demo-company', 'デモ会社', NOW(), NOW())
    ON CONFLICT ("companyId") DO UPDATE
    SET "name" = EXCLUDED."name", "updatedAt" = NOW();
  `)

  const tables = [
    'admin_users',
    'categories',
    'products',
    'stores',
    'stocks',
    'box_types',
    'saved_layouts',
  ]

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "${table}"
      ADD COLUMN IF NOT EXISTS "companyId" TEXT;
    `)

    await prisma.$executeRawUnsafe(`
      UPDATE "${table}"
      SET "companyId" = 'demo-company'
      WHERE "companyId" IS NULL;
    `)

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "${table}"
      ALTER COLUMN "companyId" SET NOT NULL;
    `)
  }

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "admin_users"
    ADD CONSTRAINT IF NOT EXISTS "admin_users_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  `).catch(() => {})

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "categories"
    ADD CONSTRAINT IF NOT EXISTS "categories_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  `).catch(() => {})

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "products"
    ADD CONSTRAINT IF NOT EXISTS "products_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  `).catch(() => {})

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "stores"
    ADD CONSTRAINT IF NOT EXISTS "stores_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  `).catch(() => {})

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "stocks"
    ADD CONSTRAINT IF NOT EXISTS "stocks_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  `).catch(() => {})

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "box_types"
    ADD CONSTRAINT IF NOT EXISTS "box_types_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  `).catch(() => {})

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "saved_layouts"
    ADD CONSTRAINT IF NOT EXISTS "saved_layouts_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  `).catch(() => {})

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "categories_companyId_name_key"
    ON "categories" ("companyId", "name");
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "stores_companyId_name_key"
    ON "stores" ("companyId", "name");
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "box_types_companyId_size_key"
    ON "box_types" ("companyId", "size");
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "stocks_companyId_productId_storeId_key"
    ON "stocks" ("companyId", "productId", "storeId");
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "companies_companyId_key"
    ON "companies" ("companyId");
  `)

  console.log('Tenant migration completed.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
