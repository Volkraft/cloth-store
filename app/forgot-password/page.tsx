"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setToken(null);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Ошибка");
    } else {
      setMessage("Если email существует, токен создан.");
      if (data.token) setToken(data.token); // для демо, без отправки email
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Восстановление пароля
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введите email, и мы отправим вам токен для сброса пароля
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          {message && (
            <div className={`px-4 py-3 rounded ${
              message.includes("Ошибка") 
                ? "bg-red-50 border border-red-200 text-red-700" 
                : "bg-green-50 border border-green-200 text-green-700"
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Получить токен"}
            </button>
          </div>

          {token && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded">
              <p className="text-sm font-medium mb-2">Токен для сброса пароля:</p>
              <div className="bg-white p-3 rounded border border-blue-300 mb-3">
                <code className="text-sm break-all">{token}</code>
              </div>
              <p className="text-sm mb-2">
                Скопируйте токен и перейдите на{" "}
                <Link
                  href={`/reset-password?token=${token}`}
                  className="font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  страницу сброса пароля
                </Link>
              </p>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Вернуться к входу
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

