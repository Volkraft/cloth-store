import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { query } from "../../../../lib/db";
import { z } from "zod";

const reorderSchema = z.object({
  productId: z.string(),
  direction: z.enum(["up", "down"]),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, direction } = reorderSchema.parse(body);

    // Get current product's display_order
    const currentProductRes = await query<{ display_order: number }>(
      `SELECT display_order FROM products WHERE id = $1`,
      [productId]
    );

    if (currentProductRes.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const currentOrder = currentProductRes.rows[0].display_order;

    // Get all products ordered by display_order
    const allProductsRes = await query<{ id: string; display_order: number }>(
      `SELECT id, display_order FROM products ORDER BY display_order DESC, created_at DESC`
    );

    const products = allProductsRes.rows;
    const currentIndex = products.findIndex((p: any) => p.id === productId);

    if (currentIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Determine target index
    let targetIndex: number;
    if (direction === "up") {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) {
        return NextResponse.json({ ok: true }); // Already at top
      }
    } else {
      targetIndex = currentIndex + 1;
      if (targetIndex >= products.length) {
        return NextResponse.json({ ok: true }); // Already at bottom
      }
    }

    const targetProduct = products[targetIndex];
    const targetOrder = targetProduct.display_order;

    // Swap display_order values
    await query(`UPDATE products SET display_order = $1 WHERE id = $2`, [
      targetOrder,
      productId,
    ]);
    await query(`UPDATE products SET display_order = $1 WHERE id = $2`, [
      currentOrder,
      targetProduct.id,
    ]);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error reordering products:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reorder products" },
      { status: 500 }
    );
  }
}

