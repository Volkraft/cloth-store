import Link from "next/link";
import ProductCard from "../components/ProductCard";
import { query } from "../lib/db";

export default async function HomePage() {
  const productsRes = await query(
    `SELECT * FROM products ORDER BY display_order DESC, created_at DESC LIMIT 100`
  );
  const products = productsRes.rows;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Магазин одежды</h1>
          <p className="text-gray-600">Добавляйте товары в корзину и оформляйте.</p>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-600">Товары еще не добавлены.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product: any) => {
            // Parse images if it's a string (JSON)
            const images = Array.isArray(product.images)
              ? product.images
              : product.images
              ? JSON.parse(product.images)
              : [];

            return (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: Number(product.price),
                  comparePrice: product.compare_price
                    ? Number(product.compare_price)
                    : null,
                  images,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

