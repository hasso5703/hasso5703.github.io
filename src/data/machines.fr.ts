import { machines, type Machine } from './machines';
import type { Lang } from '../i18n/ui';

// The French text of each machine, by slug. Names, makers, the names owners use, memory sizes and links are the
// English entry's own: they are names and facts, the same in both languages.
type Text = { memoryNote: string; tested?: string };

const fr: Record<string, Text> = {
  'nvidia-dgx-spark': {
    memoryNote:
      '128 Go chez NVIDIA. Depuis le 23 octobre 2026, les partenaires de NVIDIA vendent aussi des configurations de 64 Go.',
  },
  'asus-ascent-gx10': {
    memoryNote: 'Vendu avec 128 Go, et avec 64 Go depuis octobre 2026.',
    tested:
      'La machine de référence du projet : chaque mesure du projet a été faite sur un ASUS Ascent GX10 de 128 Go, ' +
      'et un second GX10 a été installé de zéro avec la seule commande.',
  },
  'dell-pro-max-gb10': {
    memoryNote:
      "Lancé sous le nom Dell Pro Max with GB10, aujourd'hui appelé Dell Pro Precision with GB10 sur dell.com, configuré " +
      'avec 64 Go ou 128 Go.',
  },
  'hp-zgx-nano-g1n': {
    memoryNote:
      '128 Go sur la page américaine de HP. NVIDIA compte HP parmi les partenaires qui vendent des configurations de 64 Go.',
  },
  'lenovo-thinkstation-pgx': { memoryNote: '128 Go.' },
  'msi-edgexpert': { memoryNote: 'Vendu avec 128 Go, et avec 64 Go depuis le 23 octobre 2026.' },
  'gigabyte-ai-top-atom': { memoryNote: 'Vendu avec 128 Go, et avec 64 Go depuis octobre 2026.' },
  'acer-veriton-gn100': { memoryNote: 'Vendu avec 128 Go ou 64 Go.' },
};

function french(m: Machine): Machine {
  const t = fr[m.slug];
  // A machine added to machines.ts without its French text stops the build here.
  if (!t) throw new Error(`machines.fr.ts: no French text for the machine ${m.slug}`);
  if (Boolean(m.tested) !== Boolean(t.tested)) {
    throw new Error(`machines.fr.ts: the machine ${m.slug} has not the same optional texts as in machines.ts`);
  }
  return { ...m, memoryNote: t.memoryNote, ...(t.tested ? { tested: t.tested } : {}) };
}

const stale = Object.keys(fr).filter((slug) => !machines.some((m) => m.slug === slug));
if (stale.length) throw new Error(`machines.fr.ts: French text for machines that machines.ts does not have: ${stale.join(', ')}`);

const frMachines = machines.map(french);

/** The machines in a language: the English entries themselves, or the same entries with their French text. */
export const getMachines = (lang: Lang): Machine[] => (lang === 'fr' ? frMachines : machines);
