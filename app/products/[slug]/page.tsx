import { notFound } from "next/navigation";
import { query } from "../../../lib/db";
import ProductPageClient from "./ProductPageClient";

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  
  let product;
  try {
    const productRes = await query(
      `SELECT * FROM products WHERE slug = $1 LIMIT 1`,
      [slug]
    );
    product = productRes.rows[0];
  } catch (error) {
    console.error("Error fetching product:", error);
    return notFound();
  }

  if (!product) {
    return notFound();
  }

  // Ensure images are properly parsed
  let images = [];
  if (Array.isArray(product.images)) {
    images = product.images;
  } else if (product.images && typeof product.images === "string") {
    try {
      images = JSON.parse(product.images);
    } catch {
      images = [];
    }
  }

  const productData = {
    ...product,
    images: images,
    price: Number(product.price),
    compare_price: product.compare_price ? Number(product.compare_price) : null,
  };

  return <ProductPageClient key={product.id} product={productData} />;
}

