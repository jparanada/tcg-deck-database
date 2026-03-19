import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { CardCategory } from "@/lib/parser";
import TextDecklist from "./text-decklist";

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

export const dynamic = "force-dynamic";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: deck } = await supabase
    .from("decks")
    .select("*, formats(id, name)")
    .eq("id", id)
    .single();

  if (!deck) notFound();

  const format = deck.formats as { id: string; name: string } | null;

  const { data: cards } = await supabase
    .from("deck_cards")
    .select("*")
    .eq("deck_id", id)
    .order("sort_order", { ascending: true });

  const deckCards = (cards ?? []) as DeckCard[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {format && (
        <Link href={`/format/${format.id}`} className="text-sm text-blue-500 hover:underline mb-4 inline-block">
          &larr; {format.name}
        </Link>
      )}
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
        {deckCards.map((card) => (
          <div key={card.id} className="relative">
            <Image
              src={card.image_url_hires}
              alt={card.card_name}
              width={245}
              height={342}
              className="rounded-lg w-full h-auto"
            />
            <span className="absolute bottom-[12%] left-1/2 -translate-x-1/2 bg-red-800 text-white text-xl font-bold w-[28%] aspect-square flex items-center justify-center rounded-lg shadow-lg">
              {card.count}
            </span>
          </div>
        ))}
      </div>

      <TextDecklist cards={deckCards} />
    </div>
  );
}
