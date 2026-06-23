import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function migrateSlugs() {
  console.log('Starting slug migration...');

  try {
    // 1. Add slug column
    console.log('Adding slug column...');
    await db.execute(sql`ALTER TABLE kitchens ADD COLUMN IF NOT EXISTS slug TEXT;`);

    // 2. Create unique index
    console.log('Creating unique index...');
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS kitchens_slug_unique
      ON kitchens(slug)
      WHERE slug IS NOT NULL;
    `);

    // 3. Generate initial slugs
    console.log('Generating base slugs...');
    await db.execute(sql`
      UPDATE kitchens
      SET slug = LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              name || '-' || city,
              '[^a-zA-Z0-9\\s\\-]', '', 'g'
            ),
            '\\s+', '-', 'g'
          ),
          '\\-+', '-', 'g'
        )
      )
      WHERE slug IS NULL AND deleted_at IS NULL;
    `);

    // 4. Handle duplicates
    console.log('Handling duplicate slugs...');
    await db.execute(sql`
      WITH ranked AS (
        SELECT id, slug,
          ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at ASC) AS rn
        FROM kitchens WHERE slug IS NOT NULL
      )
      UPDATE kitchens k
      SET slug = r.slug || '-' || r.rn
      FROM ranked r
      WHERE k.id = r.id AND r.rn > 1;
    `);

    console.log('Slug migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSlugs();
