"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function switchStore(formData: FormData) {
  const storeId = formData.get("storeId") as string;
  if (storeId) {
    cookies().set("activeStore", storeId, {
      path:     "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 30, // 30 días
    });
  }
  redirect("/dashboard");
}
