import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { query } from "../../../lib/db";

const orderSchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(5),
  address: z.string().min(5),
  comment: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().min(1),
        image: z.string().optional(),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id || null;

    // Admin users have id="admin" which doesn't exist in users table
    // Set user_id to null for admin orders (they're not real users in DB)
    if (userId === 'admin') {
      userId = null;
    }

    const body = await request.json();
    const parsed = orderSchema.parse(body);

    const total = parsed.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const id = randomUUID();
    await query(
      `INSERT INTO orders (id, user_id, customer_name, email, phone, address, comment, total, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        userId,
        parsed.customerName,
        parsed.email || null,
        parsed.phone,
        parsed.address,
        parsed.comment || null,
        total,
        JSON.stringify(parsed.items),
      ]
    );

    return NextResponse.json({ id, total }, { status: 201 });
  } catch (error: any) {
    console.error("Order create error", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create order" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin sees all orders, users see only their own
  if (session.user?.role === "ADMIN") {
    const res = await query(
      `SELECT o.*, u.email as user_email, u.name as user_name 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC LIMIT 200`
    );

    return NextResponse.json({
      orders: res.rows.map((o: any) => ({
        ...o,
        total: Number(o.total),
      })),
    });
  }

  // Regular user - only their orders
  const res = await query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [session.user?.id]
  );

  return NextResponse.json({
      orders: res.rows.map((o: any) => ({
      ...o,
      total: Number(o.total),
    })),
  });
}

