"use client";

type Order = {
  id: string;
  customer_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  comment?: string | null;
  total: number;
  items: any;
  created_at: string;
};

export default function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-hidden rounded border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2">Дата</th>
            <th className="px-4 py-2">Клиент</th>
            <th className="px-4 py-2">Контакты</th>
            <th className="px-4 py-2">Сумма</th>
            <th className="px-4 py-2">Товары</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t align-top">
              <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                {new Date(o.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-2">
                <div className="font-semibold">{o.customer_name}</div>
                {o.address && (
                  <div className="text-xs text-gray-600">{o.address}</div>
                )}
                {o.comment && (
                  <div className="text-xs text-gray-600">{o.comment}</div>
                )}
              </td>
              <td className="px-4 py-2 text-xs text-gray-700">
                {o.email && <div>Email: {o.email}</div>}
                {o.phone && <div>Тел: {o.phone}</div>}
              </td>
              <td className="px-4 py-2 font-semibold">{Number(o.total)} ₽</td>
              <td className="px-4 py-2 text-xs text-gray-700 space-y-1">
                {Array.isArray(o.items) &&
                  o.items.map((item: any, idx: number) => (
                    <div key={idx}>
                      {item.name} × {item.quantity} — {item.price} ₽
                    </div>
                  ))}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td className="px-4 py-4 text-gray-600" colSpan={5}>
                Заказов нет.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

