"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "qa-office:knowledge";
const MAX_TEXT_LENGTH = 20000;

export type KnowledgeKind = "pdf" | "link" | "image" | "file";

export const KNOWLEDGE_KIND_LABELS: Record<KnowledgeKind, string> = {
  pdf: "PDF",
  link: "Link",
  image: "Imagen",
  file: "Archivo",
};

export interface KnowledgeDoc {
  id: string;
  kind: KnowledgeKind;
  name: string;
  addedAt: string;
  pages?: number;
  text: string;
  url?: string;
}

interface KnowledgeContextValue {
  docs: KnowledgeDoc[];
  hydrated: boolean;
  addDoc: (doc: Omit<KnowledgeDoc, "id">) => KnowledgeDoc;
  removeDoc: (id: string) => void;
}

const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<KnowledgeDoc>[];
        setDocs(parsed.map((d) => ({ kind: "pdf", ...d }) as KnowledgeDoc));
      }
    } catch {
      // Corrupt or inaccessible storage — start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch {
      // Storage full or unavailable (private browsing) — edits stay in-memory for this session.
    }
  }, [docs, hydrated]);

  const value = useMemo<KnowledgeContextValue>(
    () => ({
      docs,
      hydrated,
      addDoc: (doc) => {
        const id = `${doc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${docs.length + 1}`;
        const trimmed: KnowledgeDoc = { ...doc, id, text: doc.text.slice(0, MAX_TEXT_LENGTH) };
        setDocs((prev) => [trimmed, ...prev]);
        return trimmed;
      },
      removeDoc: (id) => {
        setDocs((prev) => prev.filter((d) => d.id !== id));
      },
    }),
    [docs, hydrated],
  );

  return <KnowledgeContext.Provider value={value}>{children}</KnowledgeContext.Provider>;
}

export function useKnowledge() {
  const ctx = useContext(KnowledgeContext);
  if (!ctx) throw new Error("useKnowledge must be used within a KnowledgeProvider");
  return ctx;
}
