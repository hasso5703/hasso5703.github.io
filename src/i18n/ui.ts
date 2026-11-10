// The words of the layouts and the components, in English and in French. English is the source: a French string
// says what its English string says (I18N.md). Numbers in a string come from the data where they can; the few
// written here are checked by scripts/check-i18n.py, which compares the numbers of each English page with its
// French page. In French, U+00A0 goes before : ; ! ? and between a number and its unit.
import type { Machine } from '../data/machines';

export type Lang = 'en' | 'fr';
export const LANGS: readonly Lang[] = ['en', 'fr'];
export const otherLang = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');

/** The language of an internal path: French under /fr/, English everywhere else. */
export const langOf = (path: string): Lang => (path === '/fr' || path.startsWith('/fr/') ? 'fr' : 'en');

/** The same internal path in the given language: adds or removes the /fr prefix. */
export function localePath(path: string, lang: Lang): string {
  const bare = langOf(path) === 'fr' ? path.slice(3) || '/' : path;
  return lang === 'fr' ? `/fr${bare}` : bare;
}

// French: « le » before a consonant, « l' » before a vowel (l'ASUS Ascent GX10, l'Acer Veriton GN100, le Dell...).
const le = (name: string) => (/^[aeiouy]/i.test(name) ? "l'" : 'le ');
const Le = (name: string) => (/^[aeiouy]/i.test(name) ? "L'" : 'Le ');

const en = {
  langName: 'English',
  ogLocale: 'en_US',
  skip: 'Skip to content',
  header: {
    home: 'Alzeo, home',
    nav: 'Main',
    models: 'Models',
    guides: 'Guides',
    gb64: '64 GB',
    machines: 'Machines',
    enterprise: 'For organizations',
    github: 'Alzeo on GitHub',
    theme: 'Switch between light and dark',
    language: 'Language',
  },
  footer: {
    nav: 'Project',
    source: 'Source on GitHub',
    releases: 'Releases',
    discussions: 'Discussions',
    forum: 'The NVIDIA forum thread',
    models: 'Models',
    guides: 'Guides',
    machines: 'Machines',
    gb64: '64 GB',
    enterprise: 'For organizations',
    support: 'Support the project',
    note: (box: string, updated: string) =>
      `Open source under the MIT license. The project's own numbers are point-in-time measurements on ${box}, with ` +
      "their method in the repo. Numbers from owners' reports are attributed and linked. DGX Spark, DGX OS and GB10 are " +
      'trademarks of NVIDIA. This project is not affiliated with NVIDIA or with any maker named here. ' +
      `Last updated ${updated}.`,
  },
  command: { label: 'The one command', copy: 'Copy', copied: 'Copied', fail: 'Select and copy' },
  receipt: {
    measuredOn: 'Measured on',
    reference: (box: string) => `${box}, the project's reference box`,
    how: 'How',
    source: 'Source',
  },
  pool: {
    label: 'Lanes',
    before: 'The 128 GB of unified memory, shared by the CPU and the GPU, held by ',
    after: ' while it serves. The other lanes wait on disk until you load one.',
  },
  guide: {
    crumb: 'Guides',
    install: 'Install it on your Spark',
    installNote: 'One command, on stock DGX OS. The same command updates it later.',
    questions: 'Questions',
    sources: 'Sources',
    checked: 'Checked',
    checkedOn: (date: string, name: string, version: string) => `${date}, against ${name} ${version}`,
    related: 'Related: ',
  },
  guides: {
    title: 'DGX Spark guides: local models, Claude Code, freezes, engines',
    description:
      'Answers for DGX Spark owners: Claude Code or opencode on a local model, why a Spark freezes when a model loads, ' +
      'which engine to run.',
    listName: 'DGX Spark guides',
    crumb: 'Guides',
    h1: 'Guides for DGX Spark owners',
    lead: 'Each one answers a question owners ask, with the source of every number.',
    gb64Title: 'What to run on a 64 GB DGX Spark',
    gb64Text: 'Nemotron 3.5 Bolt at 110.8 tok/s and Qwen3.8-27B at 67.2 tok/s at a 64 GB budget, and what needs 128 GB.',
  },
  models: {
    title: 'Best models for a DGX Spark, measured: Qwen3.8, Nemotron, Kolibri',
    description:
      'Nine models measured on a DGX Spark: Qwen3.8 27B at 65.2 to 68.5 tok/s with a 1M context, a 176B on one box, Nemotron 3.5 ' +
      'Bolt at 140 tok/s, image, video.',
    listName: 'Models measured on a DGX Spark',
    crumb: 'Models',
    h1: 'Nine models, measured on a DGX Spark',
    lead: (box: string) =>
      `Each one is a lane: pinned, proved before it serves, and loaded with one button. Numbers from ${box}, with their method.`,
    cols: ['Model', 'Measured', 'What it is', '64 GB box'],
    yes: 'Yes',
    no: 'No',
  },
  model: {
    headline: (name: string) => `Run ${name} on a DGX Spark`,
    title: (name: string, fact: string) => `Run ${name} on a DGX Spark: ${fact}`,
    measuredFact: (headline: string) => `${headline}, measured`,
    description: (name: string, headline: string, what: string, local: boolean) =>
      `${name} on a DGX Spark: ${headline}, ${what}. Loaded with one button, ` +
      (local ? 'driven from the cockpit.' : 'with OpenAI and Anthropic APIs.'),
    faq: {
      run: (name: string) => `Can a DGX Spark run ${name}?`,
      runAnswer: (about: string, site: string) =>
        `Yes. ${about} The installer of ${site} sets it up, and the cockpit loads it with one button.`,
      fast: (name: string) => `How fast is ${name} on a DGX Spark?`,
      fastAnswer: (headline: string, what: string, box: string, facts: string) =>
        `${headline}, ${what}, measured on ${box}. ${facts}.`,
      fits: (name: string) => `Does ${name} run on a 64 GB DGX Spark?`,
    },
    crumb: 'Models',
    lead: (kind: string, maker: string, build: string) => `${kind}, by ${maker}. ${build}.`,
    answer: (about: string, box: string) => `${about} On ${box}: `,
    measured: 'Measured',
    load: 'Load it',
    loadPick: 'From the cockpit: open the Lanes view, pick ',
    loadPress: ' and press ',
    loadRest: (cockpit?: string) =>
      `${cockpit ? ` (${cockpit})` : ''}. From a terminal, in the repo folder on the box:`,
    switchNote:
      " never restarts an engine itself: it prints the exact stop and start commands. The cockpit's Load runs them for you.",
    variants: 'Other checkpoints of the same lane load the same way: ',
    on64: 'On a 64 GB DGX Spark',
    fitsLink: 'What runs on 64 GB',
    notFits: 'A 64 GB box serves Nemotron 3.5 Bolt and Qwen3.8-27B: ',
    notFitsLink: 'what runs on 64 GB',
    useLocal: 'Use it',
    localBefore: (view: string) => `From the cockpit: its ${view} view drives the lane. The lane listens on `,
    localAfter: ', on the box itself, and not through the API on port 30001.',
    useTools: 'Use it from your tools',
    toolsBefore:
      'The box serves OpenAI- and Anthropic-compatible APIs on port 30001, with an API key. Claude Code, opencode, ' +
      'Open WebUI and the OpenAI and Anthropic SDKs point there instead of a cloud: see ',
    toolsClaude: 'Claude Code with a local model',
    toolsAnd: ' and ',
    toolsOpencode: 'opencode with a local model',
    install: 'Install it',
    installText: 'One command, on stock DGX OS. The same command updates it later.',
    faqTitle: (name: string) => `Questions about ${name} on a DGX Spark`,
    others: 'The other lanes',
  },
  machines: {
    title: 'Local AI on every GB10: DGX Spark and its seven partner machines',
    description:
      'The DGX Spark and the GB10 machines of ASUS, Dell, HP, Lenovo, MSI, GIGABYTE and Acer, 64 or 128 GB: what each ' +
      'runs, measured, in one command.',
    listName: 'GB10 machines',
    crumb: 'Machines',
    h1: 'Every GB10 machine runs it',
    lead:
      'The NVIDIA DGX Spark and its partner machines share one chip, the GB10, and one system, DGX OS. The installer reads ' +
      'how much memory the box has, not which brand is on it.',
    tag: (gb: string) => `${gb} GB`,
    calloutLead: '64 GB or 128 GB?',
    callout: ' A 128 GB box runs all nine lanes. A 64 GB box runs Nemotron 3.5 Bolt and Qwen3.8-27B.',
    calloutLink: 'See what fits on 64 GB',
  },
  machine: {
    title: (m: Machine) => `Run local AI models on the ${m.titleName ?? m.short}`,
    runOn: (m: Machine) => `${/^(Acer|ASUS|HP|MSI|NVIDIA)/.test(m.name) ? 'an' : 'a'} ${m.name}`,
    description: (m: Machine, has64: boolean) =>
      `The ${m.short} as a private AI server in one command: Qwen3.8 27B at 65.2 to 68.5 tok/s and eight more models on ` +
      `128 GB${has64 ? ', Bolt on 64 GB' : ''}.`,
    headline: (m: Machine) => `Run local AI models on the ${m.name}`,
    crumb: 'Machines',
    h1: (m: Machine) => `Local AI on the ${m.name}`,
    lead: (aka: string, note: string) => `Also known as ${aka}. ${note}`,
    answer: (m: Machine) =>
      `The ${m.name} is a GB10 machine: NVIDIA's Grace Blackwell chip and its unified memory, on DGX OS. One command ` +
      'turns it into a private AI server with OpenAI- and Anthropic-compatible APIs and a local cockpit, and no prompt, ' +
      'image or video leaves the box.',
    untested: (runOn: string) =>
      'The project is measured on an ASUS Ascent GX10, the same chip and the same system. The installer reads the ' +
      `memory of the box, not its brand. If you run it on ${runOn}, tell us how it went in `,
    discussions: 'the discussions',
    with128: 'With 128 GB: every lane',
    // French says once per page what a lane is; English needs no line here.
    laneNote: '',
    cols: ['Lane', 'Measured'],
    with64: 'With 64 GB: Bolt and the 27B',
    with64Text:
      "A 64 GB box serves NVIDIA's Nemotron 3.5 Bolt at 110.8 tok/s (greedy median) and keeps Qwen3.8-27B one Load " +
      'away at 67.2 tok/s, both measured at a 64 GB budget on the reference box. Lanes that need 128 GB are refused ' +
      'before anything is downloaded. ',
    with64Link: 'What runs on 64 GB, in detail',
    install: 'Install it',
    installText: 'On stock DGX OS, run this on the box. The same command updates it later.',
    numbers: 'Numbers',
    numbersText: (box: string) => `measured on ${box}, methods in `,
    maker: "Maker's page",
  },
};

export type UI = typeof en;

const fr: UI = {
  langName: 'Français',
  ogLocale: 'fr_FR',
  skip: 'Aller au contenu',
  header: {
    home: 'Alzeo, accueil',
    nav: 'Navigation principale',
    models: 'Modèles',
    guides: 'Guides',
    gb64: '64 Go',
    machines: 'Machines',
    // The header's row has no room for « Pour les organisations » from 761 to 960 px; the footer says it in full.
    enterprise: 'Organisations',
    github: 'Alzeo sur GitHub',
    theme: 'Basculer entre le thème clair et le thème sombre',
    language: 'Langue',
  },
  footer: {
    nav: 'Projet',
    source: 'Code source sur GitHub',
    releases: 'Versions',
    discussions: 'Discussions',
    forum: 'Le fil du forum NVIDIA',
    models: 'Modèles',
    guides: 'Guides',
    machines: 'Machines',
    gb64: '64 Go',
    enterprise: 'Pour les organisations',
    support: 'Soutenir le projet',
    note: (box: string, updated: string) =>
      `Open source sous licence MIT. Les chiffres propres au projet sont des mesures ponctuelles sur ${box}, avec leur ` +
      'méthode dans le dépôt. Les chiffres tirés des retours de possesseurs sont attribués et accompagnés de leur lien. ' +
      "DGX Spark, DGX OS et GB10 sont des marques de NVIDIA. Ce projet n'est affilié ni à NVIDIA ni à aucun fabricant " +
      `cité ici. Dernière mise à jour : ${updated}.`,
  },
  command: { label: 'La seule commande', copy: 'Copier', copied: 'Copié', fail: 'Sélectionnez et copiez' },
  receipt: {
    measuredOn: 'Mesuré sur',
    reference: (box: string) => `${box}, la machine de référence du projet`,
    how: 'Méthode',
    source: 'Source',
  },
  pool: {
    label: 'Lanes',
    before: 'Les 128 Go de mémoire unifiée, partagés par le CPU et le GPU, sont occupés par ',
    after: " tant que cette lane sert. Les autres lanes attendent sur disque jusqu'à ce que vous en chargiez une.",
  },
  guide: {
    crumb: 'Guides',
    install: 'Installez-le sur votre Spark',
    installNote: "Une seule commande, sur DGX OS d'origine. La même commande le met à jour ensuite.",
    questions: 'Questions',
    sources: 'Sources',
    checked: 'Vérifié',
    checkedOn: (date: string, name: string, version: string) => `le ${date}, sur ${name} ${version}`,
    related: 'Voir aussi : ',
  },
  guides: {
    title: 'Guides DGX Spark : modèles locaux, Claude Code, gels, moteurs',
    description:
      'Des réponses pour les possesseurs de DGX Spark : Claude Code ou opencode sur un modèle local, pourquoi un Spark ' +
      "se fige au chargement d'un modèle, quel moteur faire tourner.",
    listName: 'Guides DGX Spark',
    crumb: 'Guides',
    h1: 'Guides pour les possesseurs de DGX Spark',
    lead: 'Chacun répond à une question que posent les possesseurs, avec la source de chaque chiffre.',
    gb64Title: 'Que faire tourner sur un DGX Spark de 64 Go',
    gb64Text:
      'Nemotron 3.5 Bolt à 110,8 tok/s et Qwen3.8-27B à 67,2 tok/s avec un budget de 64 Go, et ce qui exige 128 Go.',
  },
  models: {
    title: 'Les meilleurs modèles pour un DGX Spark, mesurés : Qwen3.8, Nemotron, Kolibri',
    description:
      'Neuf modèles mesurés sur un DGX Spark : Qwen3.8 27B entre 65,2 et 68,5 tok/s avec un contexte de 1M, un 176B ' +
      'sur une seule machine, Nemotron 3.5 Bolt à 140 tok/s, image, vidéo.',
    listName: 'Modèles mesurés sur un DGX Spark',
    crumb: 'Modèles',
    h1: 'Neuf modèles, mesurés sur un DGX Spark',
    lead: (box: string) =>
      `Chacun est une lane, un modèle prêt à servir : épinglé, prouvé avant de servir et chargé d'un seul bouton. ` +
      `Chiffres mesurés sur ${box}, avec leur méthode.`,
    cols: ['Modèle', 'Mesuré', "Ce que c'est", 'Machine de 64 Go'],
    yes: 'Oui',
    no: 'Non',
  },
  model: {
    headline: (name: string) => `Faire tourner ${name} sur un DGX Spark`,
    title: (name: string, fact: string) => `Faire tourner ${name} sur un DGX Spark : ${fact}`,
    measuredFact: (headline: string) => `${headline}, mesuré`,
    description: (name: string, headline: string, what: string, local: boolean) =>
      `${name} sur un DGX Spark : ${headline}, ${what}. Chargé d'un seul bouton, ` +
      (local ? 'piloté depuis le cockpit.' : 'avec les API OpenAI et Anthropic.'),
    faq: {
      run: (name: string) => `Un DGX Spark peut-il faire tourner ${name} ?`,
      runAnswer: (about: string, site: string) =>
        `Oui. ${about} L'installeur d'${site} le met en place, et le cockpit le charge d'un seul bouton.`,
      fast: (name: string) => `Quelle vitesse atteint ${name} sur un DGX Spark ?`,
      fastAnswer: (headline: string, what: string, box: string, facts: string) =>
        `${headline}, ${what}, mesuré sur ${box}. ${facts}.`,
      fits: (name: string) => `${name} tourne-t-il sur un DGX Spark de 64 Go ?`,
    },
    crumb: 'Modèles',
    lead: (kind: string, maker: string, build: string) => `${kind}, par ${maker}. ${build}.`,
    answer: (about: string, box: string) => `${about} Sur ${box} : `,
    measured: 'Mesuré',
    load: 'Le charger',
    loadPick: 'Depuis le cockpit : ouvrez la vue Lanes, où chaque lane est un modèle prêt à servir, choisissez ',
    loadPress: ' et appuyez sur ',
    loadRest: (cockpit?: string) =>
      `${cockpit ? ` (${cockpit})` : ''}. Depuis un terminal, dans le dossier du dépôt sur la machine :`,
    switchNote:
      " ne redémarre jamais un moteur lui-même : il affiche les commandes exactes d'arrêt et de démarrage. Le Load du " +
      'cockpit les lance pour vous.',
    variants: 'Les autres checkpoints de la même lane se chargent de la même façon : ',
    on64: 'Sur un DGX Spark de 64 Go',
    fitsLink: 'Ce qui tourne sur 64 Go',
    notFits: 'Une machine de 64 Go sert Nemotron 3.5 Bolt et Qwen3.8-27B : ',
    notFitsLink: 'ce qui tourne sur 64 Go',
    useLocal: "L'utiliser",
    localBefore: (view: string) => `Depuis le cockpit : sa vue ${view} pilote la lane. La lane écoute sur `,
    localAfter: ", sur la machine elle-même, et pas par l'API du port 30001.",
    useTools: "L'utiliser depuis vos outils",
    toolsBefore:
      'La machine sert des API compatibles OpenAI et Anthropic sur le port 30001, avec une clé API. Claude Code, opencode, ' +
      "Open WebUI et les SDK OpenAI et Anthropic pointent vers elle au lieu d'un cloud : voir ",
    toolsClaude: 'Claude Code avec un modèle local',
    toolsAnd: ' et ',
    toolsOpencode: 'opencode avec un modèle local',
    install: "L'installer",
    installText: "Une seule commande, sur DGX OS d'origine. La même commande le met à jour ensuite.",
    faqTitle: (name: string) => `Questions sur ${name} et le DGX Spark`,
    others: 'Les autres lanes',
  },
  machines: {
    title: "L'IA locale sur tous les GB10 : le DGX Spark et ses sept machines partenaires",
    description:
      "Le DGX Spark et les machines GB10 d'ASUS, Dell, HP, Lenovo, MSI, GIGABYTE et Acer, de 64 ou 128 Go : ce que " +
      'chacune fait tourner, mesuré, en une seule commande.',
    listName: 'Machines GB10',
    crumb: 'Machines',
    h1: 'Toutes les machines GB10 le font tourner',
    lead:
      'Le NVIDIA DGX Spark et ses machines partenaires partagent une puce, le GB10, et un système, DGX OS. ' +
      "L'installeur lit la quantité de mémoire de la machine, pas la marque inscrite dessus.",
    tag: (gb: string) => `${gb} Go`,
    calloutLead: '64 Go ou 128 Go ?',
    callout:
      ' Une machine de 128 Go fait tourner les neuf lanes, des modèles prêts à servir. Une machine de 64 Go fait ' +
      'tourner Nemotron 3.5 Bolt et Qwen3.8-27B.',
    calloutLink: 'Voir ce qui tient sur 64 Go',
  },
  machine: {
    title: (m: Machine) =>
      `Faire tourner des modèles d'IA locaux sur ${le(m.titleName ?? m.short)}${m.titleName ?? m.short}`,
    runOn: (m: Machine) => `un ${m.name}`,
    description: (m: Machine, has64: boolean) =>
      `${Le(m.short)}${m.short} en serveur d'IA privé, en une seule commande : Qwen3.8 27B entre 65,2 et ` +
      `68,5 tok/s et huit autres modèles sur 128 Go${has64 ? ', Bolt sur 64 Go' : ''}.`,
    headline: (m: Machine) => `Faire tourner des modèles d'IA locaux sur ${le(m.name)}${m.name}`,
    crumb: 'Machines',
    h1: (m: Machine) => `L'IA locale sur ${le(m.name)}${m.name}`,
    lead: (aka: string, note: string) => `Aussi appelé ${aka}. ${note}`,
    answer: (m: Machine) =>
      `${Le(m.name)}${m.name} est une machine GB10 : la puce Grace Blackwell de NVIDIA et sa mémoire unifiée, sous ` +
      "DGX OS. Une seule commande en fait un serveur d'IA privé avec des API compatibles OpenAI et Anthropic et un " +
      'cockpit local, et aucun prompt, aucune image, aucune vidéo ne quitte la machine.',
    untested: (runOn: string) =>
      'Le projet est mesuré sur un ASUS Ascent GX10, avec la même puce et le même système. ' +
      "L'installeur lit la mémoire de la machine, pas sa marque. Si vous le faites tourner sur " +
      `${runOn}, racontez-nous comment cela s'est passé dans `,
    discussions: 'les discussions',
    with128: 'Avec 128 Go : toutes les lanes',
    laneNote: 'Une lane est un modèle prêt à servir.',
    cols: ['Lane', 'Mesuré'],
    with64: 'Avec 64 Go : Bolt et la 27B',
    with64Text:
      'Une machine de 64 Go sert Nemotron 3.5 Bolt de NVIDIA à 110,8 tok/s (médiane gloutonne) et garde ' +
      'Qwen3.8-27B à un clic sur Load, à 67,2 tok/s, tous deux mesurés avec un budget de 64 Go sur la machine de ' +
      'référence. Les lanes qui exigent 128 Go sont refusées avant tout téléchargement. ',
    with64Link: 'Ce qui tourne sur 64 Go, en détail',
    install: "L'installer",
    installText: "Sous DGX OS d'origine, lancez ceci sur la machine. La même commande le met à jour ensuite.",
    numbers: 'Chiffres',
    numbersText: (box: string) => `mesurés sur ${box}, méthodes dans `,
    maker: 'Page du fabricant',
  },
};

export const ui: Record<Lang, UI> = { en, fr };
