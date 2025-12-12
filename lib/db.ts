import { Pool, PoolClient, QueryResult } from "pg";

let pool: Pool | null = null;
let schemaInitialized = false;

function getPool(): Pool {
  // Lazy initialization - only create pool when needed and if DATABASE_URL is set
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    // Determine if SSL is needed based on connection string
    // For cloud databases (Supabase, Neon, Vercel), always use SSL with rejectUnauthorized: false
    const dbUrl = process.env.DATABASE_URL.toLowerCase();
    const needsSSL = dbUrl.includes('vercel') || 
                     dbUrl.includes('neon') || 
                     dbUrl.includes('supabase') ||
                     dbUrl.includes('pooler') ||
                     dbUrl.includes('aws-') ||
                     dbUrl.includes('sslmode=require');
    
    // For cloud databases, always use SSL with rejectUnauthorized: false
    // This allows self-signed certificates which are common in cloud database services
    const sslConfig = needsSSL ? { 
      rejectUnauthorized: false 
    } : undefined;
    
    if (needsSSL && process.env.NODE_ENV === 'development') {
      console.log('Using SSL connection with rejectUnauthorized: false for cloud database');
    }
    
    // Set NODE_TLS_REJECT_UNAUTHORIZED for this process if needed (as fallback)
    if (needsSSL && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    // Handle pool errors
    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle client', err);
      if (err?.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
        console.warn('SSL certificate error in pool, resetting...');
        resetPool();
      }
    });
  }
  return pool;
}

// Function to reset pool (useful for reconnection after SSL errors)
function resetPool() {
  if (pool) {
    pool.end().catch(() => {}); // Ignore errors when closing
    pool = null;
  }
}

async function ensureSchema() {
  // During build time, skip schema initialization if DB is not available
  if (!process.env.DATABASE_URL) {
    return;
  }
  
  if (schemaInitialized) {
    // Always run migrations even if schema was initialized
    try {
      await runMigrations();
    } catch (error: any) {
      if (
        error?.code === 'ECONNREFUSED' || 
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNRESET' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('connection')
      ) {
        console.warn('Database unavailable, skipping migrations:', error.message);
        return;
      }
      // Don't throw on migration errors - just log them
      // This prevents the app from crashing if migrations fail
      console.error('Migration error (non-fatal):', error);
      return;
    }
    return;
  }
  schemaInitialized = true;

  // Simple schema for products and orders; variants/colors omitted
  // Wrap in try-catch to prevent app crashes if DB is unavailable
  try {
    await getPool().query(`
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
  } catch (error: any) {
    // Handle various database connection errors
    if (
      error?.code === 'ECONNREFUSED' || 
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNRESET' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('SSL') ||
      error?.message?.includes('certificate') ||
      error?.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
      error?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
    ) {
      console.warn('Database unavailable during schema initialization:', error.message);
      // Reset schemaInitialized flag so we can retry on next request
      schemaInitialized = false;
      return;
    }
    // Log other errors but don't crash the app - schema might already exist
    console.error('Database schema initialization error (non-fatal):', error);
    // Don't throw - allow the app to continue
    // Schema might already exist or will be created on retry
    return;
  }
  
  try {
    await runMigrations();
  } catch (error: any) {
    // Don't throw on migration errors - just log them
    // This prevents the app from crashing if migrations fail
    if (
      error?.code === 'ECONNREFUSED' || 
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNRESET' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('connection')
    ) {
      console.warn('Database unavailable, skipping migrations:', error.message);
      return;
    }
    // Log other migration errors but don't crash the app
    console.error('Migration error (non-fatal):', error);
    return;
  }
}

async function runMigrations() {
  // Skip migrations if DATABASE_URL is not set (build time)
  if (!process.env.DATABASE_URL) {
    return;
  }
  
  // Migration: Add user_id column to orders if it doesn't exist
  // Only run if users table exists (to avoid foreign key errors)
  try {
    await getPool().query(`
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
  } catch (error: any) {
    if (
      error?.code === 'ECONNREFUSED' || 
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNRESET' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('connection')
    ) {
      console.warn('Database unavailable, skipping migrations:', error.message);
      return;
    }
    // Log other migration errors but don't crash the app
    console.error('Migration error (non-fatal):', error);
    return;
  }
}

export async function query<T extends Record<string, any> = any>(
  text: string,
  params: any[] = [],
  client?: PoolClient
): Promise<QueryResult<T>> {
  // During build time, if DATABASE_URL is not set, return empty result
  if (!process.env.DATABASE_URL) {
    return {
      rows: [] as T[],
      rowCount: 0,
      command: 'SELECT',
      oid: 0,
      fields: []
    } as QueryResult<T>;
  }
  
  try {
    await ensureSchema();
    if (client) return client.query<T>(text, params);
    return getPool().query<T>(text, params);
  } catch (error: any) {
    // Log full error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Database query error details:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
        query: text.substring(0, 100) + '...'
      });
    }
    // During build time or runtime, database might not be available
    // Return empty result set instead of throwing for connection errors
    if (
      error?.code === 'ECONNREFUSED' || 
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNRESET' ||
      error?.message?.includes('DATABASE_URL') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('SSL') ||
      error?.message?.includes('certificate') ||
      error?.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
      error?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
    ) {
      // If SSL error, reset pool to force recreation with correct SSL settings
      if (error?.code === 'SELF_SIGNED_CERT_IN_CHAIN' || error?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        console.error('SSL certificate error detected:', {
          code: error?.code,
          message: error?.message,
          databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + '...'
        });
        console.warn('Resetting connection pool to apply SSL settings');
        resetPool();
        // Reset schema flag to allow retry
        schemaInitialized = false;
      }
      // Log more details for ENOTFOUND to help debug connection string issues
      if (error?.code === 'ENOTFOUND') {
        console.error('Database host not found (ENOTFOUND):', {
          hostname: error?.hostname,
          message: error?.message,
          hint: 'Check your DATABASE_URL connection string. The hostname might be incorrect or the database project might be paused/deleted.'
        });
      } else {
        console.warn('Database connection unavailable:', error.message);
      }
      return {
        rows: [] as T[],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as QueryResult<T>;
    }
    // For other errors (SQL syntax, etc.), log and rethrow
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  try {
    await ensureSchema();
    return getPool().connect();
  } catch (error: any) {
    if (
      error?.code === 'ECONNREFUSED' || 
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNRESET' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('connection')
    ) {
      throw new Error('Database connection unavailable');
    }
    throw error;
  }
}

export async function closePool() {
  if (pool) {
    return pool.end();
  }
}

