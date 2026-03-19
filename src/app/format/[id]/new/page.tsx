"use client";

import { useState } from "react";
import { parseDeckList } from "@/lib/parser";
import type { ParseResult } from "@/lib/parser";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function NewDeckPage() {
  const router = useRouter();
  const { id: formatId } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [creator, setCreator] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [rawList, setRawList] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handlePreview() {
    if (!rawList.trim()) return;
    setPreview(parseDeckList(rawList));
  }

  async function handleSave() {
    if (!preview || !name.trim()) return;
    setSaving(true);
    setError("");

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .insert({
        format_id: formatId,
        name: name.trim(),
        slug,
        creator: creator.trim() || null,
        source: source.trim() || null,
        notes: notes.trim() || null,
        raw_list: rawList,
        published: true,
        pokemon_count: preview.pokemonCount,
        trainer_count: preview.trainerCount,
        energy_count: preview.energyCount,
        total_count: preview.totalCount,
      })
      .select("id")
      .single();

    if (deckError || !deck) {
      setError(deckError?.message ?? "Failed to save deck");
      setSaving(false);
      return;
    }

    const cardRows = preview.cards.map((card) => ({
      deck_id: deck.id,
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
      setError(cardsError.message);
      setSaving(false);
      return;
    }

    router.push(`/deck/${deck.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">New Deck</h1>

      <div className="space-y-4 mb-8">
        <div>
          <label htmlFor="deck-name" className="block text-sm font-medium mb-1">
            Deck Name
          </label>
          <input
            id="deck-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Abomasnow / Bronzong"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="creator" className="block text-sm font-medium mb-1">
            Creator
          </label>
          <input
            id="creator"
            type="text"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="e.g. Whimsicast"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-1">
            Source
          </label>
          <input
            id="source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="URL or description"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="deck-list" className="block text-sm font-medium mb-1">
            Deck List
          </label>
          <textarea
            id="deck-list"
            value={rawList}
            onChange={(e) => setRawList(e.target.value)}
            placeholder={`Pokémon: 25\n3 Snover SF 74\n3 Abomasnow SF 12\n...`}
            rows={16}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent font-mono text-sm"
          />
        </div>

        <button
          onClick={handlePreview}
          className="bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          Preview
        </button>
      </div>

      {preview && (
        <div className="space-y-6">
          <div className="flex gap-4 text-sm">
            <span>P: {preview.pokemonCount}</span>
            <span>T: {preview.trainerCount}</span>
            <span>E: {preview.energyCount}</span>
            <span className="font-bold">{preview.totalCount}/60</span>
            <span className="text-gray-500">
              ({preview.cards.length} unique lines)
            </span>
          </div>

          {preview.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-600 mb-2">Parse Errors</h3>
              <ul className="text-sm space-y-1">
                {preview.errors.map((err, i) => (
                  <li key={i}>
                    Line {err.line}: &quot;{err.text}&quot; &mdash; {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.expectedPokemon !== null &&
            preview.pokemonCount !== preview.expectedPokemon && (
              <p className="text-yellow-600 text-sm">
                Pokemon count mismatch: expected {preview.expectedPokemon}, got{" "}
                {preview.pokemonCount}
              </p>
            )}
          {preview.expectedTrainer !== null &&
            preview.trainerCount !== preview.expectedTrainer && (
              <p className="text-yellow-600 text-sm">
                Trainer count mismatch: expected {preview.expectedTrainer}, got{" "}
                {preview.trainerCount}
              </p>
            )}
          {preview.expectedEnergy !== null &&
            preview.energyCount !== preview.expectedEnergy && (
              <p className="text-yellow-600 text-sm">
                Energy count mismatch: expected {preview.expectedEnergy}, got{" "}
                {preview.energyCount}
              </p>
            )}

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {preview.cards.map((card, i) => (
              <div key={i} className="relative">
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  width={245}
                  height={342}
                  className="rounded w-full h-auto"
                  unoptimized
                />
                <span className="absolute bottom-[12%] left-1/2 -translate-x-1/2 bg-red-800 text-white text-xl font-bold w-[28%] aspect-square flex items-center justify-center rounded-lg shadow-lg">
                  {card.count}
                </span>
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Deck"}
          </button>
        </div>
      )}
    </div>
  );
}
