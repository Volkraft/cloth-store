"use client";

import { useState } from "react";

type Props = {
  user: {
    email: string;
    name?: string | null;
    phone?: string | null;
    address?: string | null;
  };
};

export default function ProfileSettings({ user }: Props) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateProfile = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/account/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, address }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Ошибка обновления");
    } else {
      setMessage("Данные обновлены");
    }
  };

  const changePassword = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/account/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Ошибка смены пароля");
    } else {
      setMessage("Пароль обновлён");
      setCurrentPassword("");
      setNewPassword("");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Личные данные</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              value={user.email}
              disabled
              className="mt-1 w-full rounded border px-3 py-2 bg-gray-100 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Телефон</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Адрес</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              rows={2}
            />
          </div>
        </div>
        <button
          onClick={updateProfile}
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Смена пароля</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Текущий пароль</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
        </div>
        <button
          onClick={changePassword}
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Обновление..." : "Обновить пароль"}
        </button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  );
}

