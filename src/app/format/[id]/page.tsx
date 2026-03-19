import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Deck {
  id: string;
  name: string;
  creator: string | null;
}

export const dynamic = "force-dynamic";

export default async function FormatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const isOwner = session?.role === "owner";

  const { data: format } = await supabase
    .from("formats")
    .select("id, name, description")
    .eq("id", id)
    .single();

  if (!format) notFound();

  const { data: decks } = await supabase
    .from("decks")
    .select("id, name, creator")
    .eq("format_id", id)
    .eq("published", true)
    .order("name", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-blue-500 hover:underline mb-4 inline-block">
        &larr; All Formats
      </Link>
      <h1 className="text-3xl font-bold mb-2">{format.name}</h1>
      {format.description && (
        <p className="text-gray-500 mb-8">{format.description}</p>
      )}

      {!decks || decks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No decks in this format yet.</p>
          {isOwner && (
            <Link
              href={`/format/${id}/new`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create your first deck
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
          {isOwner && (
            <Link
              href={`/format/${id}/new`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              New Deck
            </Link>
          )}
        </>
      )}
    </div>
  );
}
