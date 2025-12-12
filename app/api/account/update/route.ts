import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { query } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    // Fetch user
    const userRes = await query(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [session.user.id]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = userRes.rows[0];

    // Handle password change
    if (parsed.newPassword) {
      if (!parsed.currentPassword) {
        return NextResponse.json(
          { error: "Current password required" },
          { status: 400 }
        );
      }
      const ok = await bcrypt.compare(parsed.currentPassword, user.password_hash);
      if (!ok) {
        return NextResponse.json(
          { error: "Current password incorrect" },
          { status: 400 }
        );
      }
      const newHash = await bcrypt.hash(parsed.newPassword, 10);
      await query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [newHash, session.user.id]
      );
    }

    // Update profile fields
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    (["name", "phone", "address"] as const).forEach((key) => {
      const val = parsed[key];
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    });

    if (fields.length) {
      values.push(session.user.id);
      await query(
        `UPDATE users SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${
          values.length
        }`,
        values
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Account update error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update" },
      { status: 400 }
    );
  }
}

