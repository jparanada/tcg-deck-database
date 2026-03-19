import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Deck {
  id: string;
  name: string;
  creator: string | null;
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: decks, error } = await supabase
    .from("decks")
    .select("id, name, creator")
    .eq("published", true)
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <p className="text-red-500">
          Failed to load decks. Make sure Supabase is configured in .env.local
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">DP&ndash;SF Format</h1>
      <p className="text-gray-500 mb-8">
        Diamond &amp; Pearl through Stormfront (Sep 2007 &ndash; Nov 2008)
      </p>

      {decks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No decks yet.</p>
          <Link
            href="/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create your first deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck: Deck) => (
            <Link
              key={deck.id}
              href={`/deck/${deck.id}`}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:border-blue-500 transition-colors"
            >
              <h2 className="font-semibold text-lg mb-1">{deck.name}</h2>
              {deck.creator && (
                <p className="text-sm text-gray-400">{deck.creator}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
