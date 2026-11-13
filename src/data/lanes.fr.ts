import { lanes, type Lane } from './lanes';
import type { Lang } from '../i18n/ui';

// The French text of each lane, by slug. Only text lives here: the numbers of `value`, the units, names, slugs, hues,
// commands, ports and sources come from lanes.ts, so they cannot differ between the two languages. The numbers
// inside these sentences are the English ones in French form, and scripts/check-i18n.py compares them page by page.
type Text = {
  kind: string;
  about: string;
  what: string;
  facts: string[];
  build: string;
  fits64: string;
  cockpit?: string;
  titleFact?: string;
  method: string;
};

const NO_64 = 'Non : il lui faut un DGX Spark de 128 Go.';

const fr: Record<string, Text> = {
  'qwen3-8-27b': {
    kind: 'Texte et code, une fenêtre de 1M de jetons',
    about:
      'Le 27B de Qwen en NVFP4 (la version de RadixArk), servi par SGLang 0.5.22 avec un modèle brouillon DFlash2, et ' +
      "une fenêtre d'un million de jetons.",
    what: 'médiane gloutonne sur deux passages, une requête (2026-11-05)',
    facts: [
      '44,0 tok/s pour une requête seule et 80,6 au total à 4 requêtes, sur des prompts de 8 192 jetons',
      "Une fenêtre d'un million de jetons",
      'GSM8K 99,2 % sur 250 problèmes',
    ],
    build: 'NVFP4 (RadixArk) avec un modèle brouillon DFlash2, sur SGLang 0.5.22',
    fits64:
      'Oui, sans la fenêtre de 1M : deux requêtes à la fois, 59 625 jetons de KV (un prompt de 54 855 jetons au ' +
      'plus), 67,2 tok/s en médiane gloutonne, mesurés avec un budget de 64 Go sur la machine de référence.',
    method: './bench.sh et le benchmark officiel de SGLang, 2026-11-05 (v1.44.0)',
  },
  'qwen3-8-flash-next-176b': {
    kind: "Un mélange d'experts de 176B sur une seule machine",
    about:
      "Le mélange d'experts de 176B de Qwen, en NVFP4 sur une seule machine, avec toute sa fenêtre de 262K : sa table " +
      'N-gram FP8 de 47,7 Gio vit dans un fichier creux sur le NVMe local, et la mémoire va aux poids et à un vrai cache KV.',
    what: 'sur du code, avec FLASH_TIER=context',
    facts: ['Une fenêtre de 262K jetons', 'GSM8K 97,41 % sur 1 314 problèmes', 'HumanEval 95,73 %, MMLU 90,8 %'],
    build: 'NVFP4 (RadixArk) avec la spéculation NEXTN, sur SGLang nightly 53295c6',
    fits64: NO_64,
    method: 'la campagne de la lane flash',
  },
  'flash-fp4-local': {
    kind: 'La version FP4 du modèle flash',
    about:
      'La version FP4 du Flash-Next par NVIDIA, sur vLLM : la qualité de la lane flash pour environ la moitié de son ' +
      "disque, avec deux fois son cache KV, et une fenêtre d'un million de jetons en option.",
    what: "médiane gloutonne, à l'effort xhigh",
    facts: [
      'À lean, son effort par défaut depuis la v1.46.4 : 47,4 tok/s seul, 106,6 au total sur 8 flux',
      'GSM8K 97,64 % sur 1 314 problèmes',
      'Environ la moitié du disque de la lane flash',
    ],
    build: 'FP4-Local (NVIDIA), sur vLLM b12x build 8244d1c',
    fits64: NO_64,
    cockpit: '17 à 19 minutes avant de répondre la première fois, environ 5 minutes et demie ensuite',
    method: "./bench.sh à l'effort xhigh",
  },
  'nemotron-3-5-bolt': {
    kind: 'Un 74B qui lit les images et la vidéo',
    about:
      'Le 74B de NVIDIA qui lit les images et la vidéo, dans un checkpoint de 24 Go, sur vLLM avec son modèle brouillon.',
    what: 'en réécriture de code, une requête, raisonnement désactivé',
    facts: ['201,2 tok/s au total sur 16 flux', 'Lit les images et la vidéo', "La lane qu'un Spark de 64 Go sert en premier"],
    build: 'avec son modèle brouillon, sur vLLM nightly 77154ca6 + b12x 1.5.1',
    fits64:
      "Oui, c'est la lane que sert une machine de 64 Go : 110,8 tok/s en médiane gloutonne et 667 874 jetons de " +
      'KV, mesurés avec un budget de 64 Go sur la machine de référence.',
    cockpit: 'environ 8 minutes avant de répondre',
    method: 'la campagne de la lane Bolt',
  },
  'nemotron-3-5-super-vl': {
    kind: 'Un 120B avec la vision et une fenêtre de 1M de jetons',
    about:
      "Le 120B de NVIDIA, avec la vision et une fenêtre d'un million de jetons, sur vLLM avec son modèle brouillon.",
    what: 'en réécriture de code, une requête, raisonnement désactivé',
    facts: ['81,7 tok/s au total sur 4 flux', "Une fenêtre d'un million de jetons", 'Lit les images et la vidéo'],
    build: 'avec son modèle brouillon, sur vLLM nightly 77154ca6 + b12x 1.5.1',
    fits64: NO_64,
    cockpit: 'environ 9 à 11 minutes avant de répondre',
    method: 'la campagne de la lane Super VL',
  },
  'flash-unsloth-gguf': {
    kind: 'La version GGUF du modèle flash, sur llama.cpp',
    about:
      "Le GGUF dynamique d'Unsloth du Flash-Next (UD-Q4_K_XL), servi par llama.cpp avec une recherche par n-grammes et " +
      "un brouillon DFlash2 : deux requêtes de 262 144 jetons à la fois, ou une d'un million.",
    what: 'médiane gloutonne, une requête',
    facts: [
      'GSM8K 98,8 % sur 250 problèmes, par le proxy',
      'Deux requêtes de 262 144 jetons à la fois, ou une de 1 048 576',
      "Le tour suivant d'un agent repris de son cache : 33 à 50 jetons recalculés",
    ],
    build: "Le GGUF UD-Q4_K_XL d'Unsloth avec le brouillon DFlash2 de ggml-org, sur llama.cpp b12316",
    fits64: NO_64,
    cockpit: '4 à 5 minutes la première fois depuis un disque USB, moins d\'une minute ensuite',
    method: './bench.sh',
  },
  'ornith-1-5-122b': {
    kind: "Un mélange d'experts de 122B avec la vision",
    about:
      "Le mélange d'experts de 122B d'Ornith AI, avec la vision et une fenêtre d'un million de jetons, en NVFP4 sur vLLM " +
      'avec sa tête MTP.',
    what: 'médiane gloutonne, une requête',
    facts: [
      '90,0 tok/s au total sur 8 flux, sur cinq vraies tâches',
      'GSM8K 98,8 % sur 250 problèmes, sur un second GX10',
      "Une fenêtre d'un million de jetons",
    ],
    build: 'NVFP4 avec sa tête MTP, sur vLLM b12x build 8244d1c',
    fits64: NO_64,
    cockpit: '5 minutes et demie la première fois, 2 à 4 ensuite',
    method: './bench.sh',
  },
  'kolibri-1': {
    kind: 'Allemand et anglais',
    about:
      "Le modèle d'Aleph Alpha pour l'allemand et l'anglais, dans ses poids FP8 officiels sur vLLM. Il demande environ " +
      "102 Go de disque et s'installe à la demande.",
    what: 'une requête',
    facts: ['121,9 tok/s sur 4 flux', '165,8 sur 8, 202,0 sur 16', "Les poids FP8 d'Aleph Alpha"],
    build: "FP8, sur vLLM 0.29.0 avec le greffon 1.0.0 d'Aleph Alpha",
    fits64: NO_64,
    cockpit: 'environ 10 minutes avant de répondre',
    method: 'la campagne de la lane Kolibri',
  },
  'qwen-image-2-1': {
    kind: "Des images à partir d'un prompt",
    about:
      "Le modèle d'image de Qwen sur SGLang. Son Turbo, la distillation en huit étapes du même modèle par Qwen, est un " +
      'second checkpoint de la lane.',
    what: 'avec son Turbo, par image 1024×1024',
    facts: [
      '34,3 s à 40 étapes sans lui',
      'Le Turbo télécharge 32,5 Go à sa première bascule',
      'Sur la même machine que les lanes de texte',
    ],
    build: 'sur SGLang Diffusion 0.5.21',
    fits64: NO_64,
    titleFact: '7,5 s par image, mesuré',
    method: '1024×1024, chronométré sur la machine',
  },
  'minimax-h3': {
    kind: 'De la vidéo avec le son',
    about:
      "Le modèle vidéo de MiniMax, qui fait le son avec l'image, servi avec la recette MiniMax-H3 du cookbook de SGLang, " +
      "telle que l'amont l'a écrite.",
    what: "avec l'adaptateur Turbo, pour 4 s de vidéo en 480P",
    facts: ['622,8 à 632,5 s à 50 étapes sans lui', "Le son fait avec l'image", "À partir d'une phrase"],
    build: 'sur SGLang Diffusion 0.5.21',
    fits64: NO_64,
    titleFact: '4 s de vidéo en 126,2 à 127,9 s',
    method: '4 s en 480P, chronométré sur la machine',
  },
};

/** A measured value in French form: 65.2 to 68.5 becomes 65,2 à 68,5, and 1,314 becomes 1 314 (U+00A0). */
export const frValue = (value: string) =>
  value.replace(/(\d),(?=\d{3}\b)/g, '$1\u00a0').replace(/(\d)\.(\d)/g, '$1,$2').replace(/ to /g, ' à ');

function french(l: Lane): Lane {
  const t = fr[l.slug];
  // A lane added to lanes.ts without its French text stops the build here, before a page shows English in French.
  if (!t) throw new Error(`lanes.fr.ts: no French text for the lane ${l.slug}`);
  if (Boolean(l.load.cockpit) !== Boolean(t.cockpit) || Boolean(l.titleFact) !== Boolean(t.titleFact)) {
    throw new Error(`lanes.fr.ts: the lane ${l.slug} has not the same optional texts as in lanes.ts`);
  }
  return {
    ...l,
    kind: t.kind,
    about: t.about,
    value: frValue(l.value),
    what: t.what,
    facts: t.facts,
    build: t.build,
    fits64: t.fits64,
    load: { ...l.load, ...(t.cockpit ? { cockpit: t.cockpit } : {}) },
    ...(t.titleFact ? { titleFact: t.titleFact } : {}),
    receipt: { ...l.receipt, method: t.method },
  };
}

const stale = Object.keys(fr).filter((slug) => !lanes.some((l) => l.slug === slug));
if (stale.length) throw new Error(`lanes.fr.ts: French text for lanes that lanes.ts does not have: ${stale.join(', ')}`);

const frLanes = lanes.map(french);

/** The lanes in a language: the English entries themselves, or the same entries with their French text. */
export const getLanes = (lang: Lang): Lane[] => (lang === 'fr' ? frLanes : lanes);

/** Whether a lane runs on a 64 GB box, read from its English entry so the answer cannot depend on the language. */
export const fitsOn64 = (slug: string) => lanes.find((l) => l.slug === slug)?.fits64.startsWith('Yes') ?? false;
