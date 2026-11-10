import type { Lang } from '../i18n/ui';

// The guides of each language, from their Markdown frontmatter. English: by rank, then by title. French: in the
// English order, so both lists read in the same order.
export type GuideFm = { slug: string; h1: string; description: string; rank?: number };

const read = (mods: Record<string, { frontmatter: GuideFm }>) => Object.values(mods).map((m) => m.frontmatter);

const en = read(import.meta.glob<{ frontmatter: GuideFm }>('../pages/guides/*.md', { eager: true })).sort(
  (a, b) => (a.rank ?? 99) - (b.rank ?? 99) || a.h1.localeCompare(b.h1),
);
const place = new Map(en.map((g, i) => [g.slug, i]));
const fr = read(import.meta.glob<{ frontmatter: GuideFm }>('../pages/fr/guides/*.md', { eager: true })).sort(
  (a, b) => (place.get(a.slug) ?? 99) - (place.get(b.slug) ?? 99) || a.h1.localeCompare(b.h1),
);

export const getGuides = (lang: Lang): GuideFm[] => (lang === 'fr' ? fr : en);
