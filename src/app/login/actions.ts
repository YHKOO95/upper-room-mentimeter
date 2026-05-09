"use server";

import { cookies } from "next/headers";

export async function verifyPin(pin: string): Promise<boolean> {
  const correctPin = process.env.ADMIN_PIN ?? "2026";
  if (pin !== correctPin) return false;

  (await cookies()).set("ur-admin", "1", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12, // 12시간
  });
  return true;
}
