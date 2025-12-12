// components/ProductCard.tsx
"use client";

"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/cart-context";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    images: string[];
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <div className="group rounded-lg border bg-white p-3">
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Нет фото
            </div>
          )}
        </div>
      </Link>
        
      <Link href={`/products/${product.slug}`}>
        <h3 className="font-medium mb-1 group-hover:underline">
          {product.name}
        </h3>
      </Link>
        
        <div className="flex items-center gap-2">
          <span className="font-bold">{product.price} ₽</span>
          {product.comparePrice && (
            <span className="text-gray-500 line-through text-sm">
              {product.comparePrice} ₽
            </span>
          )}
        </div>
        
      <button
        className="mt-3 w-full bg-black text-white py-2 rounded flex items-center justify-center gap-2"
        onClick={() =>
          addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: 1,
          })
        }
      >
          <ShoppingBag size={16} />
          В корзину
        </button>
    </div>
  );
}