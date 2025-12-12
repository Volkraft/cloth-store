import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variantsRes = await query(
      `SELECT pv.*, c.name as color_name, c.value as color_value, c.images as color_images
       FROM product_variants pv
       LEFT JOIN colors c ON pv.color_id = c.id
       WHERE pv.product_id = $1
       ORDER BY COALESCE(pv.display_order, 999999), pv.size, c.name`,
      [id]
    );

    const variants = variantsRes.rows.map((v: any) => {
      const colorImages = v.color_images
        ? (Array.isArray(v.color_images)
            ? v.color_images
            : typeof v.color_images === "string"
            ? JSON.parse(v.color_images)
            : [])
        : [];
      return {
        id: v.id,
        size: v.size,
        colorId: v.color_id,
        colorName: v.color_name || null,
        colorValue: v.color_value || null,
        colorImages: colorImages,
        stock: Number(v.stock),
      };
    });

    return NextResponse.json({ variants });
  } catch (error: any) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch variants" },
      { status: 500 }
    );
  }
}

