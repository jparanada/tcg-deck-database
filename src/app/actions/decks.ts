"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

interface CardRow {
  card_name: string;
  set_abbrev: string;
  collector_number: string;
  api_card_id: string;
  image_url: string;
  image_url_hires: string;
  category: string;
  count: number;
  sort_order: number;
}

export async function createDeck(data: {
  formatId: string;
  name: string;
  creator: string | null;
  source: string | null;
  notes: string | null;
  rawList: string;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  totalCount: number;
  cards: CardRow[];
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

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({
      format_id: data.formatId,
      name: data.name.trim(),
      slug,
      creator: data.creator,
      source: data.source,
      notes: data.notes,
      raw_list: data.rawList,
      published: true,
      pokemon_count: data.pokemonCount,
      trainer_count: data.trainerCount,
      energy_count: data.energyCount,
      total_count: data.totalCount,
    })
    .select("id")
    .single();

  if (deckError || !deck) {
    return { error: deckError?.message ?? "Failed to save deck" };
  }

  const cardRows = data.cards.map((card) => ({
    deck_id: deck.id,
    ...card,
  }));

  const { error: cardsError } = await supabase
    .from("deck_cards")
    .insert(cardRows);

  if (cardsError) {
    return { error: cardsError.message };
  }

  return { id: deck.id };
}

export async function deleteDeck(
  deckId: string
): Promise<{ error: string } | null> {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("decks").delete().eq("id", deckId);

  if (error) {
    return { error: error.message };
  }

  return null;
}
