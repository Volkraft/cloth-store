import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { query } from "../../lib/db";
import LogoutButton from "../../components/LogoutButton";
import ProfileSettings from "../../components/ProfileSettings";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
    return;
  }

  const userId = session.user?.id;

  // Get user info
  const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
  const user = userRes.rows[0];

  // Get user orders
  const ordersRes = await query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  const orders = ordersRes.rows;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Мой профиль</h1>
        <LogoutButton />
      </div>

      <ProfileSettings user={user} />

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">История заказов</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">У вас пока нет заказов</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">Заказ #{order.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {Number(order.total).toFixed(2)} ₽
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {(() => {
                    let items: any[] = [];
                    try {
                      items = typeof order.items === 'string' 
                        ? JSON.parse(order.items) 
                        : order.items || [];
                    } catch {
                      items = [];
                    }
                    return items.map((item: any, idx: number) => (
                      <div key={idx} className="text-sm text-gray-600">
                        {item.name} × {item.quantity} — {item.price * item.quantity} ₽
                      </div>
                    ));
                  })()}
                </div>

                {order.address && (
                  <div className="mt-2 text-sm text-gray-500">
                    Адрес доставки: {order.address}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

