// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { query } from "../../../lib/db";
import { z } from "zod";
import { randomUUID } from "crypto";

const variantSchema = z.object({
  size: z.string().min(1),
  colorName: z.string(),
  colorValue: z.string(),
  stock: z.number().int().min(0),
  colorId: z.string().nullable().optional(), // Optional: used when editing to update existing colors
  colorImages: z.string().optional(), // Optional: images for this color (newline-separated URLs)
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional().nullable(),
  category: z.string().optional(),
  images: z.array(z.string().url()).optional().default([]),
  featured: z.boolean().optional().default(false),
  variants: z.array(variantSchema).optional().default([]),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;
  
  const productsRes = await query(
    `SELECT * FROM products ORDER BY display_order DESC, created_at DESC LIMIT $1 OFFSET $2`,
    [limit, skip]
  );
  const totalRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM products`
  );
  const total = Number(totalRes.rows[0]?.count || 0);
  
  return NextResponse.json({
    products: productsRes.rows.map((p: any) => ({
      ...p,
      price: Number(p.price),
      comparePrice: p.compare_price ? Number(p.compare_price) : null,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const parsed = productSchema.parse(body);
    
    // Generate base slug
    let baseSlug = parsed.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Ensure slug is not empty
    if (!baseSlug) {
      baseSlug = `product-${Date.now()}`;
    }
    
    // Check for existing slug and make it unique
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await query(
        `SELECT id FROM products WHERE slug = $1`,
        [slug]
      );
      if (existing.rows.length === 0) {
        break; // Slug is unique
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Get max display_order to place new product at the top
    const maxOrderRes = await query<{ max: number | null }>(
      `SELECT MAX(display_order) as max FROM products`
    );
    const maxOrder = maxOrderRes.rows[0]?.max ?? -1;
    const newDisplayOrder = maxOrder + 1;

    const id = randomUUID();
    const inserted = await query(
      `INSERT INTO products
        (id, name, slug, description, price, compare_price, category, images, featured, display_order)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        parsed.name,
        slug,
        parsed.description ?? null,
        parsed.price,
        parsed.comparePrice ?? null,
        parsed.category ?? null,
        JSON.stringify(parsed.images ?? []),
        parsed.featured ?? false,
        newDisplayOrder,
      ]
    );

    // Save variants
    if (parsed.variants && parsed.variants.length > 0) {
      for (const variant of parsed.variants) {
        let colorId: string | null = null;

        // If colorId is provided (editing existing color), update the color
        if (variant.colorId && variant.colorValue) {
          // Check if color still exists
          const existingColorRes = await query(
            `SELECT id FROM colors WHERE id = $1`,
            [variant.colorId]
          );

          if (existingColorRes.rows.length > 0) {
            // Update existing color
            const colorImages = variant.colorImages
              ? JSON.stringify(
                  variant.colorImages
                    .split("\n")
                    .map((url) => url.trim())
                    .filter(Boolean)
                )
              : JSON.stringify([]);
            await query(
              `UPDATE colors SET name = $1, value = $2, images = $3 WHERE id = $4`,
              [
                variant.colorName || variant.colorValue,
                variant.colorValue || variant.colorName,
                colorImages,
                variant.colorId
              ]
            );
            colorId = variant.colorId;
          } else {
            // Color was deleted, create new one
            const colorUuid = randomUUID();
            const colorImages = variant.colorImages
              ? JSON.stringify(
                  variant.colorImages
                    .split("\n")
                    .map((url) => url.trim())
                    .filter(Boolean)
                )
              : JSON.stringify([]);
            await query(
              `INSERT INTO colors (id, name, value, images) VALUES ($1, $2, $3, $4)`,
              [colorUuid, variant.colorName || variant.colorValue, variant.colorValue || variant.colorName, colorImages]
            );
            colorId = colorUuid;
          }
        } else if (variant.colorValue) {
          // No colorId provided - check if color with this value exists
          let colorRes = await query(
            `SELECT id FROM colors WHERE value = $1`,
            [variant.colorValue]
          );

          if (colorRes.rows.length === 0) {
            // Create new color
            const colorUuid = randomUUID();
            const colorImages = variant.colorImages
              ? JSON.stringify(
                  variant.colorImages
                    .split("\n")
                    .map((url) => url.trim())
                    .filter(Boolean)
                )
              : JSON.stringify([]);
            await query(
              `INSERT INTO colors (id, name, value, images) VALUES ($1, $2, $3, $4)`,
              [colorUuid, variant.colorName || variant.colorValue, variant.colorValue || variant.colorName, colorImages]
            );
            colorId = colorUuid;
          } else {
            // For new products, always create a new color if images are provided
            // to avoid sharing images between products
            const colorImages = variant.colorImages
              ? JSON.stringify(
                  variant.colorImages
                    .split("\n")
                    .map((url) => url.trim())
                    .filter(Boolean)
                )
              : null;
            
            if (colorImages) {
              // Create new color to avoid sharing images between products
              const colorUuid = randomUUID();
              await query(
                `INSERT INTO colors (id, name, value, images) VALUES ($1, $2, $3, $4)`,
                [colorUuid, variant.colorName || variant.colorValue, variant.colorValue || variant.colorName, colorImages]
              );
              colorId = colorUuid;
            } else {
              // No images, can reuse existing color
              colorId = colorRes.rows[0].id;
              if (variant.colorName) {
                await query(
                  `UPDATE colors SET name = $1 WHERE id = $2`,
                  [variant.colorName, colorId]
                );
              }
            }
          }
        }

        // Create variant with display order
        await query(
          `INSERT INTO product_variants (id, product_id, size, color_id, stock, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [randomUUID(), id, variant.size, colorId, variant.stock, parsed.variants.indexOf(variant)]
        );
      }
    }
    
    return NextResponse.json(
      inserted.rows.map((product: any) => ({
        ...product,
        price: Number(product.price),
        comparePrice: product.compare_price
          ? Number(product.compare_price)
          : null,
      }))[0],
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}