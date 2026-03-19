"use client";

import { useState } from "react";
import { createFormat } from "@/app/actions/formats";
import { useRouter } from "next/navigation";

export default function NewFormatPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    const result = await createFormat({
      name: name.trim(),
      description: description.trim() || null,
    });

    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push(`/format/${result.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">New Format</h1>

      <div className="space-y-4 mb-8">
        <div>
          <label htmlFor="format-name" className="block text-sm font-medium mb-1">
            Format Name
          </label>
          <input
            id="format-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2008–2009 DP–SF"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Diamond & Pearl through Stormfront (Nov 2008 – Feb 2009 Cities)"
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Format"}
        </button>
      </div>
    </div>
  );
}
