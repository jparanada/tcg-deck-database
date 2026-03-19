"use client";

import { useState } from "react";
import type { CardCategory } from "@/lib/parser";

interface DeckCard {
  card_name: string;
  set_abbrev: string;
  collector_number: string;
  category: CardCategory;
  count: number;
}

const CATEGORY_LABELS: Record<CardCategory, string> = {
  pokemon: "Pokémon",
  trainer: "Trainer",
  energy: "Energy",
};

const CATEGORIES: CardCategory[] = ["pokemon", "trainer", "energy"];

function buildDecklistText(cards: DeckCard[]) {
  const grouped = {
    pokemon: cards.filter((c) => c.category === "pokemon"),
    trainer: cards.filter((c) => c.category === "trainer"),
    energy: cards.filter((c) => c.category === "energy"),
  };

  return CATEGORIES.map((cat) => {
    const catCards = grouped[cat];
    if (catCards.length === 0) return null;
    const catCount = catCards.reduce((sum, c) => sum + c.count, 0);
    return (
      `${CATEGORY_LABELS[cat]}: ${catCount}\n` +
      catCards
        .map((c) => `${c.count} ${c.card_name} ${c.set_abbrev} ${c.collector_number}`)
        .join("\n") +
      "\n\n"
    );
  })
    .filter(Boolean)
    .join("")
    .trimEnd();
}

export default function TextDecklist({ cards }: { cards: DeckCard[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = buildDecklistText(cards);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors rounded-lg"
      >
        <span>Show Text Decklist</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="relative px-4 pb-4">
          <button
            onClick={handleCopy}
            className="absolute top-0 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          <pre className="text-sm whitespace-pre-wrap" style={{ fontFamily: "var(--font-inconsolata)" }}>
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}
