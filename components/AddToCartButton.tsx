"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/cart-context";

type Props = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

export default function AddToCartButton({ id, name, price, image }: Props) {
  const { addItem } = useCart();

  return (
    <button
      className="inline-flex items-center gap-2 rounded bg-black px-4 py-3 text-white"
      onClick={() =>
        addItem({
          id,
          name,
          price,
          image,
          quantity: 1,
        })
      }
    >
      <ShoppingBag size={18} />
      В корзину
    </button>
  );
}

