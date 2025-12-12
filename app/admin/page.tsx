import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { query } from "../../lib/db";
import AdminPageClient from "./AdminPageClient";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    return redirect("/admin/login?callbackUrl=/admin");
  }

  const productsRes = await query(
    `SELECT * FROM products ORDER BY display_order DESC, created_at DESC LIMIT 200`
  );
  const products = productsRes.rows;

  const ordersRes = await query(
    `SELECT o.*, u.email as user_email, u.name as user_name 
     FROM orders o 
     LEFT JOIN users u ON o.user_id = u.id 
     ORDER BY o.created_at DESC LIMIT 200`
  );
  const orders = ordersRes.rows;

  const usersRes = await query(
    `SELECT id, email, name, phone, address, created_at FROM users ORDER BY created_at DESC LIMIT 200`
  );
  const users = usersRes.rows;

  const mapped = products.map((p: any) => {
    // Ensure images are properly parsed
    let imagesArray: string[] = [];
    if (Array.isArray(p.images)) {
      imagesArray = p.images;
    } else if (p.images && typeof p.images === "string") {
      try {
        imagesArray = JSON.parse(p.images);
      } catch {
        imagesArray = [];
      }
    }
    
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      comparePrice: p.compare_price ? Number(p.compare_price) : null,
      category: p.category,
      description: p.description,
      images: imagesArray,
      featured: p.featured || false,
    };
  });

  return (
    <AdminPageClient 
      initialProducts={mapped}
      initialOrders={orders}
      initialUsers={users}
    />
  );
}
