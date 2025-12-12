import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { query } from "../../../../lib/db";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);

    // Check if user exists
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [
      parsed.email,
    ]);

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(parsed.password, 10);

    // Create user
    const id = randomUUID();
    await query(
      `INSERT INTO users (id, email, password_hash, name, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        parsed.email,
        passwordHash,
        parsed.name || null,
        parsed.phone || null,
        parsed.address || null,
      ]
    );

    return NextResponse.json(
      { message: "User created successfully", userId: id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register" },
      { status: 400 }
    );
  }
}

