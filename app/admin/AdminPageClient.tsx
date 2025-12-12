"use client";

import { useState } from "react";
import ProductForm from "../../components/ProductForm";
import AdminProductTable from "../../components/AdminProductTable";
import OrdersTable from "../../components/OrdersTable";
import UsersTable from "../../components/UsersTable";

type Product = {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  category?: string | null;
  description?: string;
  images?: string[];
  featured?: boolean;
};

export default function AdminPageClient({
  initialProducts,
  initialOrders,
  initialUsers,
}: {
  initialProducts: Product[];
  initialOrders: any[];
  initialUsers: any[];
}) {
  // Normalize products to ensure comparePrice is never undefined
  const normalizedProducts = initialProducts.map(p => ({
    ...p,
    comparePrice: p.comparePrice ?? null,
  }));
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleCancel = () => {
    setEditingProduct(null);
  };

  const handleChanged = () => {
    setEditingProduct(null);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
        <p className="mt-2 text-gray-600">
          Управляйте товарами, заказами и пользователями
        </p>
      </div>

      {/* Таблица товаров сверху */}
      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Товары</h2>
        </div>
        <AdminProductTable 
          initialProducts={normalizedProducts} 
          onEdit={handleEdit}
          onChanged={handleChanged}
        />
      </div>

      {/* Форма создания/редактирования снизу */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingProduct ? "Редактирование товара" : "Создать новый товар"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {editingProduct ? "Измените данные товара и нажмите 'Сохранить изменения'" : "Заполните форму и нажмите 'Создать товар'"}
          </p>
        </div>
        <ProductForm 
          key={editingProduct?.id || "new"} 
          product={editingProduct ? {
            ...editingProduct,
            category: editingProduct.category ?? undefined,
          } : null}
          onCancel={handleCancel}
          onCreated={handleChanged}
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Заказы</h2>
          <OrdersTable orders={initialOrders} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Пользователи</h2>
          <UsersTable users={initialUsers} />
        </div>
      </div>
    </div>
  );
}

