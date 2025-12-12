"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import VariantForm from "./VariantForm";

type FormValues = {
  name: string;
  price: number;
  comparePrice?: number | null;
  category?: string;
  description?: string;
  images?: string;
  featured?: boolean;
};

type Product = {
  id: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  category?: string;
  description?: string;
  images?: string[];
  featured?: boolean;
};

type Variant = {
  size: string;
  colorName: string;
  colorValue: string;
  stock: number;
  colorId?: string | null; // Optional: used when editing to update existing colors
  colorImages?: string; // Optional: images for this color (newline-separated URLs)
};

export default function ProductForm({ 
  onCreated,
  product,
  onCancel,
}: { 
  onCreated?: () => void;
  product?: Product | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      featured: false,
    },
  });

  useEffect(() => {
    if (product) {
      // Ensure images are properly parsed
      let imagesArray: string[] = [];
      if (Array.isArray(product.images)) {
        imagesArray = product.images;
      } else if (product.images && typeof product.images === "string") {
        try {
          imagesArray = JSON.parse(product.images);
        } catch {
          imagesArray = [];
        }
      }

      reset({
        name: product.name,
        price: product.price,
        comparePrice: product.comparePrice || undefined,
        category: product.category || "",
        description: product.description || "",
        images: imagesArray.length > 0 ? imagesArray.join("\n") : "",
        featured: product.featured || false,
      });
      
      // Load variants
      fetch(`/api/products/${product.id}/variants`)
        .then((res) => res.json())
        .then((data) => {
          if (data.variants && Array.isArray(data.variants)) {
            // Transform API data to VariantForm format
            const transformedVariants = data.variants.map((v: any) => {
              const colorImages = v.colorImages
                ? (Array.isArray(v.colorImages)
                    ? v.colorImages.join("\n")
                    : typeof v.colorImages === "string"
                    ? v.colorImages
                    : "")
                : "";
              return {
                size: v.size || "",
                colorName: v.colorName || "",
                colorValue: v.colorValue || "",
                stock: v.stock || 0,
                colorId: v.colorId || null, // Preserve colorId for updating existing colors
                colorImages: colorImages,
              };
            });
            setVariants(transformedVariants);
          } else {
            setVariants([]);
          }
        })
        .catch(() => {
          setVariants([]);
        });
    } else {
      reset({
        name: "",
        price: 0,
        comparePrice: undefined,
        category: "",
        description: "",
        images: "",
        featured: false,
      });
      setVariants([]);
    }
  }, [product?.id, product?.name, product?.images, reset]); // Use specific fields instead of whole object

  const onSubmit = async (data: FormValues) => {
    const images = data.images
      ? data.images
          .split("\n")
          .map((url) => url.trim())
          .filter(Boolean)
      : [];

    const payload = {
      name: data.name,
      price: Number(data.price),
      comparePrice: data.comparePrice ? Number(data.comparePrice) : null,
      category: data.category,
      description: data.description,
      images,
      featured: data.featured ?? false,
      variants: variants.filter((v) => v.size && v.stock > 0),
    };

    const url = product ? `/api/products/${product.id}` : "/api/products";
    const method = product ? "PATCH" : "POST";

    // Debug: log the product ID being updated
    if (product) {
      console.log("Updating product with ID:", product.id);
      console.log("Images being saved:", images);
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || `Ошибка ${product ? "обновления" : "создания"}`);
      return;
    }

    if (!product) {
      reset({ featured: false });
      setVariants([]);
    }
    router.refresh();
    onCreated?.();
    onCancel?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Название</label>
        <input
          {...register("name", { required: true })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
          placeholder="Футболка"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Цена</label>
          <input
            type="number"
            step="0.01"
            {...register("price", { valueAsNumber: true, required: true })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Старая цена</label>
          <input
            type="number"
            step="0.01"
            {...register("comparePrice", { valueAsNumber: true })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Категория</label>
          <input
            {...register("category")}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
            placeholder="Худи"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              {...register("featured")} 
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black focus:ring-offset-0"
            />
            Хит продаж
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          URL изображений (по одному на строку)
        </label>
        <textarea
          {...register("images")}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors resize-none"
          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Введите URL каждого изображения с новой строки
        </p>
      </div>

      <VariantForm variants={variants} onChange={setVariants} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание</label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        {product && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${product ? "flex-1" : "w-full"} rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`}
        >
          {isSubmitting 
            ? "Сохранение..." 
            : product 
              ? "Сохранить изменения" 
              : "Создать товар"}
        </button>
      </div>
    </form>
  );
}

