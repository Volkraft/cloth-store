import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { query } from "../../../../lib/db";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = schema.parse(body);

    const resetRes = await query(
      `SELECT * FROM password_resets WHERE token = $1 AND used = false`,
      [token]
    );
    if (resetRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or used token" },
        { status: 400 }
      );
    }

    const reset = resetRes.rows[0];
    if (new Date(reset.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const userId = reset.user_id;
    if (!userId) {
      return NextResponse.json({ error: "User missing" }, { status: 400 });
    }

    const newHash = await bcrypt.hash(password, 10);

    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      newHash,
      userId,
    ]);
    await query(
      `UPDATE password_resets SET used = true WHERE token = $1`,
      [token]
    );

    return NextResponse.json({ message: "Password updated" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reset password" },
      { status: 400 }
    );
  }
}

