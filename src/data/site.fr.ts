import { SITE } from './site';
import type { Lang } from '../i18n/ui';

// The French words of the facts every page repeats. Every other field of SITE (version, dates, URLs) is the same in
// both languages and is read from SITE itself.
const fr = {
  sentence:
    "Alzeo est un installeur open source qui transforme un NVIDIA DGX Spark, ou toute machine GB10 (ASUS, Dell, HP, " +
    "Lenovo, MSI, GIGABYTE, Acer), en serveur d'IA privé, en une seule commande : des lanes de modèles mesurées, " +
    'les API OpenAI et Anthropic, et un cockpit local.',
  privacy: 'Aucun prompt, aucune image, aucune vidéo ne quitte la machine.',
  referenceBox: 'un ASUS Ascent GX10 de 128 Go',
};

export type SiteText = { sentence: string; privacy: string; referenceBox: string };

export function siteText(lang: Lang): SiteText {
  return lang === 'fr' ? fr : { sentence: SITE.sentence, privacy: SITE.privacy, referenceBox: SITE.referenceBox };
}
