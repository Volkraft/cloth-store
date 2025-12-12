import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { z } from "zod";
import { query } from "../../../../lib/db";
import { randomUUID } from "crypto";

const variantSchema = z.object({
  size: z.string().min(1),
  colorName: z.string(),
  colorValue: z.string(),
  stock: z.number().int().min(0),
  colorId: z.string().nullable().optional(), // Optional: used when editing to update existing colors
  colorImages: z.string().optional(), // Optional: images for this color (newline-separated URLs)
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().nullable().optional(),
  category: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  featured: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      // Variants are handled separately below
      if (key === "variants") continue;

      if (key === "images") {
        fields.push(`images = $${idx++}`);
        values.push(JSON.stringify(value));
      } else if (key === "comparePrice") {
        fields.push(`compare_price = $${idx++}`);
        values.push(value);
      } else {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No data" }, { status: 400 });
    }

    values.push(id);

    const updated = await query(
      `UPDATE products SET ${fields.join(
        ", "
      )} WHERE id = $${idx} RETURNING *`,
      values
    );

    // Update variants if provided
    if (data.variants !== undefined) {
      // Get current variants BEFORE deleting to check color usage
      const currentVariantsRes = await query(
        `SELECT color_id FROM product_variants WHERE product_id = $1`,
        [id]
      );
      const currentColorIds = currentVariantsRes.rows
        .map((r: any) => r.color_id)
        .filter((id: any) => id !== null);

      // Delete existing variants
      await query(`DELETE FROM product_variants WHERE product_id = $1`, [id]);

      // Insert new variants
      if (data.variants.length > 0) {
        for (const variant of data.variants) {
          let colorId: string | null = null;

          const colorImages = variant.colorImages
            ? JSON.stringify(
                variant.colorImages
                  .split("\n")
                  .map((url) => url.trim())
                  .filter(Boolean)
              )
            : JSON.stringify([]);

          // When updating a product, ALWAYS create a new color if images are provided
          // This ensures each product has its own color with unique images
          if (variant.colorValue) {
            if (variant.colorImages && variant.colorImages.trim()) {
              // Always create a new color when images are provided to avoid conflicts
              const colorUuid = randomUUID();
              await query(
                `INSERT INTO colors (id, name, value, images) VALUES ($1, $2, $3, $4)`,
                [
                  colorUuid,
                  variant.colorName || variant.colorValue,
                  variant.colorValue || variant.colorName,
                  colorImages,
                ]
              );
              colorId = colorUuid;
            } else {
              // No images provided - check if we can reuse an existing color
              // But only if it's not used by other products (excluding current product)
              let colorRes = await query(
                `SELECT id FROM colors WHERE value = $1 LIMIT 1`,
                [variant.colorValue]
              );

              if (colorRes.rows.length > 0) {
                const existingColorId = colorRes.rows[0].id;
                // Check if this color is used by other products (excluding current product)
                const usageCheck = await query(
                  `SELECT COUNT(DISTINCT pv.product_id) as product_count
                   FROM product_variants pv
                   WHERE pv.color_id = $1 AND pv.product_id != $2`,
                  [existingColorId, id]
                );
                const productCount = Number(usageCheck.rows[0]?.product_count || 0);

                if (productCount === 0) {
                  // Color is only used in this product (or not used at all), can reuse
                  colorId = existingColorId;
                  if (variant.colorName) {
                    await query(`UPDATE colors SET name = $1 WHERE id = $2`, [
                      variant.colorName,
                      colorId,
                    ]);
                  }
                } else {
                  // Color is used by other products, create a new one
                  const colorUuid = randomUUID();
                  await query(
                    `INSERT INTO colors (id, name, value, images) VALUES ($1, $2, $3, $4)`,
                    [
                      colorUuid,
                      variant.colorName || variant.colorValue,
                      variant.colorValue || variant.colorName,
                      JSON.stringify([]),
                    ]
                  );
                  colorId = colorUuid;
                }
              } else {
                // No color with this value exists, create new one
                const colorUuid = randomUUID();
                await query(
                  `INSERT INTO colors (id, name, value, images) VALUES ($1, $2, $3, $4)`,
                  [
                    colorUuid,
                    variant.colorName || variant.colorValue,
                    variant.colorValue || variant.colorName,
                    JSON.stringify([]),
                  ]
                );
                colorId = colorUuid;
              }
            }
          }

          // Create variant with display order
          await query(
            `INSERT INTO product_variants (id, product_id, size, color_id, stock, display_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [randomUUID(), id, variant.size, colorId, variant.stock, data.variants.indexOf(variant)]
          );
        }
      }
    }

    return NextResponse.json({
      ...updated.rows[0],
      price: Number(updated.rows[0].price),
      comparePrice: updated.rows[0].compare_price
        ? Number(updated.rows[0].compare_price)
        : null,
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await query(`DELETE FROM products WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}

