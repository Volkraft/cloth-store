"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialToken = searchParams.get("token") || "";
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Ошибка");
    } else {
      setMessage("Пароль обновлён. Теперь можно войти.");
      setPassword("");
      setToken("");
      setTimeout(() => router.push("/login"), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Сброс пароля
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введите токен и новый пароль
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
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Токен восстановления
              </label>
              <input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Вставьте токен из email"
              />
              <p className="mt-1 text-xs text-gray-500">
                Токен был отправлен на ваш email после запроса восстановления пароля
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Новый пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Минимум 6 символов"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Обновление..." : "Обновить пароль"}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Не получили токен?{" "}
              <Link className="text-blue-600 hover:text-blue-500 underline" href="/forgot-password">
                Запросить снова
              </Link>
            </p>
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

