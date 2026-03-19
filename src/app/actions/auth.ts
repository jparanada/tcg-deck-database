"use server";

import { supabase } from "@/lib/supabase";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, password_hash, role")
    .eq("username", username)
    .single();

  if (error || !user) {
    return { error: "Invalid username or password." };
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return { error: "Invalid username or password." };
  }

  await createSession(user.id, user.username, user.role);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
