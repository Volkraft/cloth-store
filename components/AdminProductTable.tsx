"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  category?: string | null;
  description?: string;
  images?: string[];
  featured?: boolean;
};

export default function AdminProductTable({
  initialProducts,
  onChanged,
  onEdit,
}: {
  initialProducts: ProductRow[];
  onChanged?: () => void;
  onEdit?: (product: ProductRow) => void;
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Sync products with initialProducts when they change (e.g., after reorder)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const remove = async (id: string) => {
    if (!confirm(`Удалить товар "${products.find(p => p.id === id)?.name}"?`)) {
      return;
    }
    
    setLoadingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      setLoadingId(null);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Не удалось удалить");
        return;
      }
      // Remove from local state immediately
      setProducts((prev) => prev.filter((p) => p.id !== id));
      // Refresh server data
      router.refresh();
      onChanged?.();
    } catch (error) {
      setLoadingId(null);
      alert("Ошибка при удалении");
    }
  };

  const reorder = async (productId: string, direction: "up" | "down") => {
    const currentIndex = products.findIndex((p) => p.id === productId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    // Optimistically update the list
    const newProducts = [...products];
    [newProducts[currentIndex], newProducts[targetIndex]] = [
      newProducts[targetIndex],
      newProducts[currentIndex],
    ];
    setProducts(newProducts);
    setReorderingId(productId);

    try {
      const res = await fetch("/api/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, direction }),
      });
      setReorderingId(null);
      if (!res.ok) {
        // Revert on error
        setProducts(products);
        const err = await res.json();
        alert(err.error || "Не удалось изменить порядок");
        return;
      }
      // Refresh server data to get updated order
      router.refresh();
      onChanged?.();
    } catch (error) {
      // Revert on error
      setProducts(products);
      setReorderingId(null);
      alert("Ошибка при изменении порядка");
    }
  };

  return (
    <div className="overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 w-24 text-xs font-semibold text-gray-600 uppercase tracking-wider">Порядок</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Название</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Категория</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Цена</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((p, index) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => reorder(p.id, "up")}
                    disabled={index === 0 || reorderingId === p.id}
                    className={`p-1.5 rounded transition-colors ${
                      index === 0 || reorderingId === p.id
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Переместить вверх"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorder(p.id, "down")}
                    disabled={index === products.length - 1 || reorderingId === p.id}
                    className={`p-1.5 rounded transition-colors ${
                      index === products.length - 1 || reorderingId === p.id
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Переместить вниз"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
              <td className="px-4 py-3 text-gray-600">{p.category || "-"}</td>
              <td className="px-4 py-3">
                <span className="font-medium">{p.price} ₽</span>
                {p.comparePrice ? (
                  <span className="ml-2 text-xs text-gray-500 line-through">
                    {p.comparePrice} ₽
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  {onEdit && (
                    <button
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                      onClick={() => onEdit(p)}
                    >
                      Редактировать
                    </button>
                  )}
                  <button
                    className="text-sm text-red-600 hover:text-red-700 hover:underline font-medium transition-colors disabled:opacity-50"
                    disabled={loadingId === p.id}
                    onClick={() => remove(p.id)}
                  >
                    {loadingId === p.id ? "..." : "Удалить"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>
                Товаров нет.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

