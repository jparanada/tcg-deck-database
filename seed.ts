import { createClient } from "@supabase/supabase-js";
import { parseDeckList } from "./src/lib/parser";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function seed() {
  const raw = readFileSync("/Users/paranada/Downloads/seed-data.json", "utf-8");
  const seedData = JSON.parse(raw);

  // Seed formats
  console.log("Seeding formats...");
  for (const format of seedData.formats) {
    const { error } = await supabase.from("formats").upsert(
      {
        name: format.name,
        slug: format.slug,
        description: format.description,
        icon: format.icon,
        sort_order: format.sort_order,
      },
      { onConflict: "slug" }
    );
    if (error) {
      console.error(`  Failed to insert format "${format.name}":`, error.message);
    } else {
      console.log(`  ✓ Format: ${format.name}`);
    }
  }

  // Get format IDs
  const { data: formats } = await supabase.from("formats").select("id, slug");
  const formatMap = new Map(formats?.map((f) => [f.slug, f.id]) ?? []);

  // Seed decks
  console.log("\nSeeding decks...");
  for (const deck of seedData.decks) {
    const result = parseDeckList(deck.raw_list);

    if (result.errors.length > 0) {
      console.error(`  Parse errors in "${deck.name}":`);
      result.errors.forEach((e) =>
        console.error(`    Line ${e.line}: ${e.message}`)
      );
      continue;
    }

    const slug = deck.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const formatId = formatMap.get(deck.format_slug);

    const { data: inserted, error: deckError } = await supabase
      .from("decks")
      .insert({
        name: deck.name,
        slug,
        format_id: formatId,
        creator: deck.creator,
        source: deck.source,
        notes: deck.notes || null,
        raw_list: deck.raw_list,
        published: deck.published ?? true,
        pokemon_count: result.pokemonCount,
        trainer_count: result.trainerCount,
        energy_count: result.energyCount,
        total_count: result.totalCount,
      })
      .select("id")
      .single();

    if (deckError || !inserted) {
      console.error(`  Failed to insert "${deck.name}":`, deckError?.message);
      continue;
    }

    const cardRows = result.cards.map((card) => ({
      deck_id: inserted.id,
      card_name: card.name,
      set_abbrev: card.setAbbrev,
      collector_number: card.collectorNumber,
      api_card_id: card.apiCardId,
      image_url: card.imageUrl,
      image_url_hires: card.imageUrlHires,
      category: card.category,
      count: card.count,
      sort_order: card.sortOrder,
    }));

    const { error: cardsError } = await supabase
      .from("deck_cards")
      .insert(cardRows);

    if (cardsError) {
      console.error(
        `  Failed to insert cards for "${deck.name}":`,
        cardsError.message
      );
      continue;
    }

    console.log(
      `  ✓ ${deck.name} (${result.totalCount}/60, ${result.cards.length} unique cards)`
    );
  }

  console.log("\nDone!");
}

seed();
