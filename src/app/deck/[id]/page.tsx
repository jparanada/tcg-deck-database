import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { CardCategory } from "@/lib/parser";

interface DeckCard {
  id: string;
  card_name: string;
  set_abbrev: string;
  collector_number: string;
  api_card_id: string;
  image_url: string;
  image_url_hires: string;
  category: CardCategory;
  count: number;
  sort_order: number;
}

const CATEGORY_LABELS: Record<CardCategory, string> = {
  pokemon: "Pokemon",
  trainer: "Trainer",
  energy: "Energy",
};

const CATEGORY_COLORS: Record<CardCategory, string> = {
  pokemon: "text-red-500",
  trainer: "text-blue-500",
  energy: "text-green-500",
};

export const dynamic = "force-dynamic";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: deck } = await supabase
    .from("decks")
    .select("*")
    .eq("id", id)
    .single();

  if (!deck) notFound();

  const { data: cards } = await supabase
    .from("deck_cards")
    .select("*")
    .eq("deck_id", id)
    .order("sort_order", { ascending: true });

  const deckCards = (cards ?? []) as DeckCard[];
  const grouped = {
    pokemon: deckCards.filter((c) => c.category === "pokemon"),
    trainer: deckCards.filter((c) => c.category === "trainer"),
    energy: deckCards.filter((c) => c.category === "energy"),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{deck.name}</h1>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
        {deck.creator && <span>by {deck.creator}</span>}
        <span>P: {deck.pokemon_count} / T: {deck.trainer_count} / E: {deck.energy_count}</span>
        <span>{deck.total_count}/60</span>
      </div>
      {deck.notes && (
        <p className="text-sm text-gray-500 mb-2">{deck.notes}</p>
      )}
      {deck.source && (
        <a
          href={deck.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:underline mb-4 inline-block"
        >
          Source
        </a>
      )}
      <div className="mb-8" />

      {(["pokemon", "trainer", "energy"] as CardCategory[]).map((cat) => {
        const catCards = grouped[cat];
        if (catCards.length === 0) return null;
        const catCount = catCards.reduce((sum, c) => sum + c.count, 0);

        return (
          <section key={cat} className="mb-10">
            <h2
              className={`text-xl font-semibold mb-4 ${CATEGORY_COLORS[cat]}`}
            >
              {CATEGORY_LABELS[cat]} ({catCount})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {catCards.map((card) => (
                <div key={card.id} className="relative">
                  <Image
                    src={card.image_url_hires}
                    alt={card.card_name}
                    width={245}
                    height={342}
                    className="rounded-lg w-full h-auto"
                  />
                  <span className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                    x{card.count}
                  </span>
                  <p className="text-xs mt-1 text-center truncate">
                    {card.card_name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
