import { Pool, PoolClient, QueryResult } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let schemaInitialized = false;

async function ensureSchema() {
  if (schemaInitialized) {
    // Always run migrations even if schema was initialized
    await runMigrations();
    return;
  }
  schemaInitialized = true;

  // Simple schema for products and orders; variants/colors omitted
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      compare_price NUMERIC(10,2),
      category TEXT,
      images JSONB DEFAULT '[]'::jsonb,
      sizes JSONB DEFAULT '[]'::jsonb,
      featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_products_updated_at'
      ) THEN
        CREATE TRIGGER set_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW
        EXECUTE PROCEDURE set_updated_at();
      END IF;
    END;
    $$;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      comment TEXT,
      total NUMERIC(10,2) NOT NULL,
      items JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS colors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      size TEXT NOT NULL,
      color_id TEXT REFERENCES colors(id) ON DELETE SET NULL,
      stock INTEGER DEFAULT 0,
      sku TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_id, size, color_id)
    );
  `);
  
  await runMigrations();
}

async function runMigrations() {
  // Migration: Add user_id column to orders if it doesn't exist
  // Only run if users table exists (to avoid foreign key errors)
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders')
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'user_id'
        ) THEN
        ALTER TABLE orders ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      END IF;
    END $$;

  -- Ensure password_resets table exists
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

  -- Migration: Add images column to colors table if it doesn't exist
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colors')
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'colors' AND column_name = 'images'
        ) THEN
        ALTER TABLE colors ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
      END IF;
    END $$;

  -- Migration: Add display_order column to product_variants if it doesn't exist
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants')
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'product_variants' AND column_name = 'display_order'
        ) THEN
        ALTER TABLE product_variants ADD COLUMN display_order INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_product_variants_display_order ON product_variants(product_id, display_order);
      END IF;
    END $$;

  -- Migration: Remove UNIQUE constraint from colors.value if it exists
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'colors' 
                 AND constraint_name = 'colors_value_key'
                 AND constraint_type = 'UNIQUE') THEN
        ALTER TABLE colors DROP CONSTRAINT colors_value_key;
      END IF;
    END $$;

  -- Migration: Add display_order column to products if it doesn't exist
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products')
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'display_order'
        ) THEN
        ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);
        -- Set display_order based on created_at for existing products using CTE
        WITH ordered_products AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn
          FROM products
        )
        UPDATE products p
        SET display_order = op.rn
        FROM ordered_products op
        WHERE p.id = op.id;
      END IF;
    END $$;
  `);
}

export async function query<T extends Record<string, any> = any>(
  text: string,
  params: any[] = [],
  client?: PoolClient
): Promise<QueryResult<T>> {
  await ensureSchema();
  if (client) return client.query<T>(text, params);
  return pool.query<T>(text, params);
}

export async function getClient() {
  await ensureSchema();
  return pool.connect();
}

export async function closePool() {
  return pool.end();
}

