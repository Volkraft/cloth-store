"use client";

import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/cart-context";
import ProductVariantSelector from "./ProductVariantSelector";

type Variant = {
  id: string;
  size: string;
  colorId: string | null;
  colorName: string | null;
  colorValue: string | null;
  colorImages?: string[];
  stock: number;
};

type Props = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  variants: Variant[];
  onColorSelect?: (colorId: string | null) => void;
};

export default function AddToCartWithVariants({
  productId,
  name,
  price,
  image,
  variants,
  onColorSelect,
}: Props) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | null | undefined>();

  // Auto-select first size and color when variants are loaded
  useEffect(() => {
    if (variants.length > 0 && !selectedSize) {
      const firstSize = Array.from(new Set(variants.map((v) => v.size))).sort()[0];
      if (firstSize) {
        const colorVariants = variants.filter(v => v.size === firstSize && v.stock > 0);
        const colorsForSize = colorVariants
          .map((v) => v.colorId)
          .filter((id, index, self) => self.indexOf(id) === index);
        
        // Prefer black color if available
        const blackColor = colorVariants.find(v => 
          v.colorValue?.toLowerCase() === '#000000' || 
          v.colorValue?.toLowerCase() === 'black' || 
          v.colorName?.toLowerCase() === 'черный' ||
          v.colorName?.toLowerCase() === 'black'
        )?.colorId;
        
        const firstColor = blackColor && colorsForSize.includes(blackColor)
          ? blackColor
          : (colorsForSize.length > 0 
              ? (colorsForSize.find(id => id !== null) || colorsForSize[0])
              : null);
        setSelectedSize(firstSize);
        setSelectedColor(firstColor);
        if (onColorSelect) {
          onColorSelect(firstColor);
        }
      }
    }
  }, [variants.length, selectedSize, onColorSelect]);

  const handleVariantSelect = (size: string, color: string | null) => {
    setSelectedSize(size);
    setSelectedColor(color);
    // Notify parent component about color selection
    if (onColorSelect) {
      onColorSelect(color);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Пожалуйста, выберите размер");
      return;
    }

    // Check if variant is available
    const variant = variants.find(
      (v) => v.size === selectedSize && v.colorId === selectedColor
    );

    if (!variant || variant.stock <= 0) {
      alert("Выбранный вариант недоступен");
      return;
    }

    const colorName = variant.colorName || "Без цвета";
    const displayName = `${name} (${selectedSize}, ${colorName})`;

    addItem({
      id: productId,
      name: displayName,
      price,
      image,
      quantity: 1,
      size: selectedSize,
      color: colorName,
    });

    alert("Товар добавлен в корзину!");
  };

  const canAddToCart = selectedSize && variants.some(
    (v) => v.size === selectedSize && v.colorId === selectedColor && v.stock > 0
  );

  return (
    <div className="space-y-4">
      <ProductVariantSelector
        variants={variants}
        onSelect={handleVariantSelect}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
      />

      <button
        className="inline-flex items-center gap-2 rounded bg-black px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleAddToCart}
        disabled={!canAddToCart}
      >
        <ShoppingBag size={18} />
        {canAddToCart ? "В корзину" : "Выберите размер и цвет"}
      </button>
    </div>
  );
}

