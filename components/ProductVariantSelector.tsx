"use client";

import { useState, useEffect } from "react";

type Variant = {
  id: string;
  size: string;
  colorId: string | null;
  colorName: string | null;
  colorValue: string | null;
  stock: number;
};

type ProductVariantSelectorProps = {
  variants: Variant[];
  onSelect: (size: string, color: string | null) => void;
  selectedSize?: string;
  selectedColor?: string | null;
};

export default function ProductVariantSelector({
  variants,
  onSelect,
  selectedSize,
  selectedColor,
}: ProductVariantSelectorProps) {
  const [localSize, setLocalSize] = useState<string | undefined>(selectedSize);
  const [localColor, setLocalColor] = useState<string | null | undefined>(selectedColor);

  // Sync with props when they change
  useEffect(() => {
    if (selectedSize !== undefined) {
      setLocalSize(selectedSize);
    }
    if (selectedColor !== undefined) {
      setLocalColor(selectedColor);
    }
  }, [selectedSize, selectedColor]);

  // Auto-select first size and color on mount if nothing is selected
  useEffect(() => {
    if (!localSize && variants.length > 0) {
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
        setLocalSize(firstSize);
        setLocalColor(firstColor);
        onSelect(firstSize, firstColor);
      }
    }
  }, [variants.length, localSize, onSelect]); // Only run once when variants are loaded

  // Get unique sizes
  const sizes = Array.from(new Set(variants.map((v) => v.size))).sort();

  // Get available colors for selected size
  const availableColors = localSize
    ? variants
        .filter((v) => v.size === localSize && v.stock > 0)
        .map((v) => ({
          id: v.colorId || "",
          name: v.colorName || "Без цвета",
          value: v.colorValue || "",
        }))
        .filter(
          (color, index, self) =>
            index === self.findIndex((c) => c.id === color.id)
        )
    : [];

  // Get available sizes for selected color
  const availableSizes = localColor
    ? variants
        .filter((v) => v.colorId === localColor && v.stock > 0)
        .map((v) => v.size)
        .filter((size, index, self) => self.indexOf(size) === index)
        .sort()
    : sizes;

  const handleSizeSelect = (size: string) => {
    setLocalSize(size);
    // Get available colors for this size
    const colorsForSize = variants
      .filter((v) => v.size === size && v.stock > 0)
      .map((v) => v.colorId)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
    
    // If current color is not available for this size, select first available color
    let newColor: string | null = null;
    if (localColor && colorsForSize.includes(localColor)) {
      // Keep current color if it's available
      newColor = localColor;
    } else if (colorsForSize.length > 0) {
      // Find color variants to check color values
      const colorVariants = variants.filter(v => v.size === size && v.stock > 0);
      // Prefer black color (#000000, black, черный) if available
      const blackColor = colorVariants.find(v => 
        v.colorValue?.toLowerCase() === '#000000' || 
        v.colorValue?.toLowerCase() === 'black' || 
        v.colorName?.toLowerCase() === 'черный' ||
        v.colorName?.toLowerCase() === 'black'
      )?.colorId;
      
      if (blackColor && colorsForSize.includes(blackColor)) {
        newColor = blackColor;
      } else {
        // Select first available color (prefer non-null colors, then null)
        const nonNullColors = colorsForSize.filter(id => id !== null);
        newColor = nonNullColors.length > 0 ? nonNullColors[0] : (colorsForSize.includes(null) ? null : colorsForSize[0]);
      }
    }
    
    setLocalColor(newColor);
    onSelect(size, newColor);
  };

  const handleColorSelect = (colorId: string | null) => {
    setLocalColor(colorId);
    onSelect(localSize || "", colorId);
  };

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Size Selector */}
      {sizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Размер
          </label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isAvailable = availableSizes.includes(size);
              const isSelected = localSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeSelect(size)}
                  disabled={!isAvailable}
                  className={`px-4 py-2 rounded border transition-all ${
                    isSelected
                      ? "bg-black text-white border-black"
                      : isAvailable
                      ? "bg-white border-gray-300 hover:border-black"
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {availableColors.length > 0 && localSize && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Цвет
          </label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const isSelected = localColor === color.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => handleColorSelect(color.id || null)}
                  className={`px-4 py-2 rounded border transition-all ${
                    isSelected
                      ? "border-black border-2"
                      : "border-gray-300 hover:border-black"
                  }`}
                  title={color.name}
                >
                  {color.value ? (
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: color.value }}
                    />
                  ) : (
                    <span className="text-sm">{color.name}</span>
                  )}
                </button>
              );
            })}
            {availableColors.some((c) => !c.value) && (
              <button
                type="button"
                onClick={() => handleColorSelect(null)}
                className={`px-4 py-2 rounded border transition-all ${
                  localColor === null
                    ? "border-black border-2"
                    : "border-gray-300 hover:border-black"
                }`}
              >
                <span className="text-sm">Без цвета</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

