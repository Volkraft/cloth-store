"use client";

import { useState, useEffect } from "react";
import { X, Plus, ChevronUp, ChevronDown } from "lucide-react";

type Variant = {
  size: string;
  colorName: string;
  colorValue: string;
  stock: number;
  colorId?: string | null; // Optional: used when editing to update existing colors
  colorImages?: string; // Optional: images for this color (newline-separated URLs)
};

type VariantFormProps = {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
};

export default function VariantForm({ variants, onChange }: VariantFormProps) {
  const [localVariants, setLocalVariants] = useState<Variant[]>(variants);

  // Sync local state when variants prop changes
  useEffect(() => {
    setLocalVariants(variants);
  }, [variants]);

  const addVariant = () => {
    const newVariants = [
      ...localVariants,
      { size: "", colorName: "", colorValue: "", stock: 0, colorId: null, colorImages: "" },
    ];
    setLocalVariants(newVariants);
    onChange(newVariants);
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | null) => {
    const updated = [...localVariants];
    const oldVariant = updated[index];
    updated[index] = { ...updated[index], [field]: value };
    
    // If colorValue changed, clear colorId to force lookup/update by new value
    // If only colorName changed, keep colorId to update existing color
    if (field === "colorValue") {
      updated[index].colorId = null;
    }
    
    setLocalVariants(updated);
    onChange(updated);
  };

  const removeVariant = (index: number) => {
    const updated = localVariants.filter((_, i) => i !== index);
    setLocalVariants(updated);
    onChange(updated);
  };

  const moveVariant = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === localVariants.length - 1) return;

    const updated = [...localVariants];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setLocalVariants(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Варианты (размер, цвет, количество)</label>
        <button
          type="button"
          onClick={addVariant}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus size={16} />
          Добавить вариант
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {localVariants.map((variant, index) => (
          <div
            key={index}
            className="p-3 border rounded bg-gray-50 space-y-2"
          >
            <div className="flex gap-2 items-start">
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs font-medium text-gray-500 w-6 text-center">
                  {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => moveVariant(index, "up")}
                  disabled={index === 0}
                  className="text-gray-600 hover:text-gray-800 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Переместить вверх"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveVariant(index, "down")}
                  disabled={index === localVariants.length - 1}
                  className="text-gray-600 hover:text-gray-800 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Переместить вниз"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Размер (S, M, L...)"
                value={variant.size}
                onChange={(e) => updateVariant(index, "size", e.target.value)}
                className="w-24 rounded border px-2 py-1 text-sm"
              />
              <input
                type="text"
                placeholder="Название цвета"
                value={variant.colorName}
                onChange={(e) => updateVariant(index, "colorName", e.target.value)}
                className="flex-1 rounded border px-2 py-1 text-sm"
              />
              <input
                type="text"
                placeholder="#hex или название"
                value={variant.colorValue}
                onChange={(e) => updateVariant(index, "colorValue", e.target.value)}
                className="flex-1 rounded border px-2 py-1 text-sm"
              />
              <input
                type="number"
                placeholder="Кол-во"
                value={variant.stock}
                onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                className="w-20 rounded border px-2 py-1 text-sm"
                min="0"
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-red-600 hover:text-red-700 p-1"
                title="Удалить вариант"
              >
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Изображения для этого цвета (каждый URL с новой строки):
              </label>
              <textarea
                placeholder="https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
                value={variant.colorImages || ""}
                onChange={(e) => updateVariant(index, "colorImages", e.target.value)}
                rows={2}
                className="w-full rounded border px-2 py-1 text-sm"
              />
            </div>
          </div>
        ))}
        {localVariants.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            Нет вариантов. Нажмите "Добавить вариант"
          </p>
        )}
      </div>
    </div>
  );
}

