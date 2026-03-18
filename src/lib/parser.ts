/**
 * Deck Vault — Pokémon TCG Deck List Parser
 *
 * Parses the exact format used in the owner's Google Docs:
 *
 *   Pokémon: 25
 *   3 Snover SF 74
 *   3 Abomasnow SF 12
 *   ...
 *
 *   Trainer: 22
 *   4 Roseanne's Research SW 125
 *   ...
 *
 *   Energy: 13
 *   4 Psychic Energy DP 127
 *   ...
 */

// ── Set Mapping ──────────────────────────────────────────────────

export const SET_MAPPING: Record<string, { apiId: string; name: string }> = {
  // Diamond & Pearl era
  DP: { apiId: "dp1", name: "Diamond & Pearl" },
  MT: { apiId: "dp2", name: "Mysterious Treasures" },
  SW: { apiId: "dp3", name: "Secret Wonders" },
  GE: { apiId: "dp4", name: "Great Encounters" },
  MD: { apiId: "dp5", name: "Majestic Dawn" },
  LA: { apiId: "dp6", name: "Legends Awakened" },
  SF: { apiId: "dp7", name: "Stormfront" },
  DPP: { apiId: "dpp", name: "DP Black Star Promos" },
};

// ── Types ────────────────────────────────────────────────────────

export type CardCategory = "pokemon" | "trainer" | "energy";

export interface ParsedCard {
  count: number;
  name: string;
  setAbbrev: string;
  collectorNumber: string;
  category: CardCategory;
  apiCardId: string;
  imageUrl: string;
  imageUrlHires: string;
  sortOrder: number;
}

export interface ParseError {
  line: number;
  text: string;
  message: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  errors: ParseError[];
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  totalCount: number;
  expectedPokemon: number | null;
  expectedTrainer: number | null;
  expectedEnergy: number | null;
}

// ── Image URL Construction ───────────────────────────────────────

/**
 * Constructs the Pokémon TCG API card ID from set abbreviation and collector number.
 *
 * CRITICAL: DP Promos (DPP) have a special format.
 * - Regular sets: apiSetId + "-" + collectorNumber  →  "dp7-74"
 * - DP Promos:    "dpp" + "-" + "DP" + collectorNumber  →  "dpp-DP18"
 */
function buildApiCardId(setAbbrev: string, collectorNumber: string): string {
  const setInfo = SET_MAPPING[setAbbrev];
  if (!setInfo) return `UNKNOWN-${collectorNumber}`;

  if (setAbbrev === "DPP") {
    const num = collectorNumber.startsWith("DP")
      ? collectorNumber
      : `DP${collectorNumber}`;
    return `${setInfo.apiId}-${num}`;
  }

  return `${setInfo.apiId}-${collectorNumber}`;
}

function buildImageUrl(apiCardId: string): string {
  const [setId, number] = apiCardId.split("-", 2);
  return `https://images.pokemontcg.io/${setId}/${number}.png`;
}

function buildImageUrlHires(apiCardId: string): string {
  const [setId, number] = apiCardId.split("-", 2);
  return `https://images.pokemontcg.io/${setId}/${number}_hires.png`;
}

// ── Parser ───────────────────────────────────────────────────────

const CATEGORY_REGEX = /^(Pokémon|Pokemon|Trainer|Energy):\s*(\d+)$/;

const CARD_REGEX = /^(\d+)\s+(.+?)\s+([A-Z][A-Za-z0-9]*)\s+(\d+|SH\d+)$/;

function normalizeCategory(raw: string): CardCategory | null {
  const lower = raw.toLowerCase();
  if (lower === "pokémon" || lower === "pokemon") return "pokemon";
  if (lower === "trainer") return "trainer";
  if (lower === "energy") return "energy";
  return null;
}

export function parseDeckList(raw: string): ParseResult {
  const lines = raw.split("\n");
  const cards: ParsedCard[] = [];
  const errors: ParseError[] = [];

  let currentCategory: CardCategory | null = null;
  let sortOrder = 0;

  let expectedPokemon: number | null = null;
  let expectedTrainer: number | null = null;
  let expectedEnergy: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const trimmed = lines[i].trim();

    if (!trimmed) continue;

    const catMatch = trimmed.match(CATEGORY_REGEX);
    if (catMatch) {
      const cat = normalizeCategory(catMatch[1]);
      const count = parseInt(catMatch[2]);
      if (cat) {
        currentCategory = cat;
        if (cat === "pokemon") expectedPokemon = count;
        else if (cat === "trainer") expectedTrainer = count;
        else if (cat === "energy") expectedEnergy = count;
      }
      continue;
    }

    const cardMatch = trimmed.match(CARD_REGEX);
    if (cardMatch) {
      if (!currentCategory) {
        errors.push({
          line: lineNum,
          text: trimmed,
          message: "Card line found before any category header",
        });
        continue;
      }

      const count = parseInt(cardMatch[1]);
      const name = cardMatch[2];
      const setAbbrev = cardMatch[3];
      const collectorNumber = cardMatch[4];

      if (!SET_MAPPING[setAbbrev]) {
        errors.push({
          line: lineNum,
          text: trimmed,
          message: `Unknown set abbreviation: "${setAbbrev}". Add it to SET_MAPPING.`,
        });
      }

      const apiCardId = buildApiCardId(setAbbrev, collectorNumber);

      cards.push({
        count,
        name,
        setAbbrev,
        collectorNumber,
        category: currentCategory,
        apiCardId,
        imageUrl: buildImageUrl(apiCardId),
        imageUrlHires: buildImageUrlHires(apiCardId),
        sortOrder: sortOrder++,
      });
    } else {
      errors.push({
        line: lineNum,
        text: trimmed,
        message: "Could not parse line. Expected format: count name SET number",
      });
    }
  }

  const pokemonCount = cards
    .filter((c) => c.category === "pokemon")
    .reduce((sum, c) => sum + c.count, 0);
  const trainerCount = cards
    .filter((c) => c.category === "trainer")
    .reduce((sum, c) => sum + c.count, 0);
  const energyCount = cards
    .filter((c) => c.category === "energy")
    .reduce((sum, c) => sum + c.count, 0);

  return {
    cards,
    errors,
    pokemonCount,
    trainerCount,
    energyCount,
    totalCount: pokemonCount + trainerCount + energyCount,
    expectedPokemon,
    expectedTrainer,
    expectedEnergy,
  };
}
