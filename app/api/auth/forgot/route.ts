import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { query } from "../../../../lib/db";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    const userRes = await query(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );
    if (userRes.rows.length === 0) {
      // Do not reveal user existence
      return NextResponse.json({ message: "If the email exists, a reset link will be sent." });
    }

    const user = userRes.rows[0];
    const token = randomUUID();
    const resetId = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await query(
      `INSERT INTO password_resets (id, user_id, token, expires_at, used)
       VALUES ($1, $2, $3, $4, false)`,
      [resetId, user.id, token, expiresAt.toISOString()]
    );

    // In real app: send email with link. Here we return token for simplicity.
    return NextResponse.json({
      message: "Reset token generated",
      token,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create reset token" },
      { status: 400 }
    );
  }
}

