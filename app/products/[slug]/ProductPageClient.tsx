"use client";

import { useState, useEffect, useMemo } from "react";
import ImageSlider from "../../../components/ImageSlider";
import AddToCartWithVariants from "../../../components/AddToCartWithVariants";

type Variant = {
  id: string;
  size: string;
  colorId: string | null;
  colorName: string | null;
  colorValue: string | null;
  colorImages?: string[];
  stock: number;
};

type ProductPageClientProps = {
  product: {
    id: string;
    name: string;
    category: string | null;
    price: number;
    compare_price: number | null;
    description: string | null;
    images: any;
  };
};

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  // Reset state when product changes
  useEffect(() => {
    setVariants([]);
    setLoading(true);
    setSelectedColorId(null);
  }, [product.id]);

  useEffect(() => {
    fetch(`/api/products/${product.id}/variants`)
      .then((res) => res.json())
      .then((data) => {
        if (data.variants && data.variants.length > 0) {
          setVariants(data.variants);
          // Auto-select first color if available (prefer black color)
          const blackColor = data.variants.find((v: Variant) => 
            v.colorValue?.toLowerCase() === '#000000' || 
            v.colorValue?.toLowerCase() === 'black' || 
            v.colorName?.toLowerCase() === 'черный' ||
            v.colorName?.toLowerCase() === 'black'
          )?.colorId;
          
          const firstColorId = blackColor || data.variants.find((v: Variant) => v.colorId)?.colorId || null;
          setSelectedColorId(firstColorId);
        } else {
          setVariants([]);
          setSelectedColorId(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setVariants([]);
        setSelectedColorId(null);
        setLoading(false);
      });
  }, [product.id]);

  // Parse images if it's a string (JSON) - use useMemo to ensure it's recalculated when product changes
  const defaultImages = useMemo(() => {
    // Handle different formats from PostgreSQL JSONB
    if (Array.isArray(product.images)) {
      return product.images.filter((img) => img && typeof img === "string");
    }
    if (product.images && typeof product.images === "string") {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) {
          return parsed.filter((img) => img && typeof img === "string");
        }
        return [];
      } catch {
        return [];
      }
    }
    if (product.images && typeof product.images === "object") {
      // Handle PostgreSQL JSONB object that might be parsed already
      try {
        const arr = Array.isArray(product.images) ? product.images : Object.values(product.images);
        return arr.filter((img) => img && typeof img === "string");
      } catch {
        return [];
      }
    }
    return [];
  }, [product.id, product.images]);

  // Get images for selected color, or use default images
  const displayImages = useMemo(() => {
    const selectedVariant = variants.find((v) => v.colorId === selectedColorId);
    if (selectedVariant?.colorImages && Array.isArray(selectedVariant.colorImages) && selectedVariant.colorImages.length > 0) {
      return selectedVariant.colorImages;
    }
    return defaultImages;
  }, [variants, selectedColorId, defaultImages]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ImageSlider 
        key={`slider-${product.id}-${displayImages.length}-${displayImages[0] || ''}`} 
        images={displayImages} 
        productName={product.name} 
      />

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-500">{product.category}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">{Number(product.price)} ₽</span>
          {product.compare_price && (
            <span className="text-gray-500 line-through">
              {Number(product.compare_price)} ₽
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-gray-700 leading-6 whitespace-pre-line">
            {product.description}
          </p>
        )}

        {!loading && (
          <AddToCartWithVariants
            productId={product.id}
            name={product.name}
            price={Number(product.price)}
            image={displayImages[0]}
            variants={variants}
            onColorSelect={setSelectedColorId}
          />
        )}
      </div>
    </div>
  );
}

