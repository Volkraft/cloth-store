"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useCart } from "../../context/cart-context";

export default function CartPage() {
  const { state, removeItem, updateQuantity, clear } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (state.items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Корзина</h1>
        <p className="text-gray-600">Пока пусто.</p>
        <Link
          href="/"
          className="inline-flex items-center rounded bg-black px-4 py-2 text-white"
        >
          В магазин
        </Link>
      </div>
    );
  }

  const submitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          email,
          phone,
          address,
          comment,
          items: state.items,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка оформления");
      }
      setMessage("Заказ оформлен! Мы свяжемся с вами.");
      clear();
      setCustomerName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setComment("");
    } catch (err: any) {
      setMessage(err.message || "Ошибка оформления");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Корзина</h1>
        <button
          className="text-sm text-gray-700 underline"
          onClick={() => clear()}
        >
          Очистить
        </button>
      </div>

      <div className="space-y-4">
        {state.items.map((item, index) => {
          const itemKey = `${item.id}-${item.size || ''}-${item.color || ''}`;
          return (
            <div
              key={itemKey}
              className="flex items-center justify-between rounded border bg-white p-4 gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded bg-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                      Нет фото
                    </div>
                  )}
                </div>
              <div>
                <p className="font-semibold">{item.name}</p>
                {(item.size || item.color) && (
                  <p className="text-xs text-gray-500">
                    {item.size && `Размер: ${item.size}`}
                    {item.size && item.color && " • "}
                    {item.color && `Цвет: ${item.color}`}
                  </p>
                )}
                <p className="text-sm text-gray-600">{item.price} ₽</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  updateQuantity(item.id, Number(e.target.value) || 1, item.size, item.color)
                }
                className="w-20 rounded border px-2 py-1"
              />
              <span className="font-semibold">
                {(item.price * item.quantity).toFixed(2)} ₽
              </span>
              <button
                className="text-sm text-red-600 underline"
                onClick={() => removeItem(item.id, item.size, item.color)}
              >
                Удалить
              </button>
            </div>
          </div>
        );
        })}
      </div>

      <div className="rounded border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">Итого: {total.toFixed(2)} ₽</p>
        </div>

        <form onSubmit={submitOrder} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Имя*</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Телефон*</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Адрес доставки*</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Комментарий</label>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>

          {message && (
            <p className="text-sm text-gray-700">{message}</p>
          )}

          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Отправка..." : "Оформить заказ"}
          </button>
        </form>
      </div>
    </div>
  );
}

