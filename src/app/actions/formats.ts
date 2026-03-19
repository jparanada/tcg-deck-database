"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function createFormat(data: {
  name: string;
  description: string | null;
}): Promise<{ id: string } | { error: string }> {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return { error: "Unauthorized" };
  }

  const slug = data.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: format, error } = await supabase
    .from("formats")
    .insert({
      name: data.name.trim(),
      slug,
      description: data.description,
    })
    .select("id")
    .single();

  if (error || !format) {
    return { error: error?.message ?? "Failed to save format" };
  }

  return { id: format.id };
}

export async function deleteFormat(
  formatId: string
): Promise<{ error: string } | null> {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("formats").delete().eq("id", formatId);

  if (error) {
    return { error: error.message };
  }

  return null;
}
