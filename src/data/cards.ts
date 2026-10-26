import { lanes } from './lanes';
import { machines } from './machines';

// One share card per page, 1200x630, built from the same data as the page so the two cannot disagree. A local script
// captures each card to public/og/<key>.png, and the layout uses a page's card when the file exists. The key is the
// page's path with its slashes turned into dashes.
export type Card = { key: string; kicker: string; title: string; sub: string; metric?: string; hue?: string };

export const ogKey = (path: string) => (path === '/' ? 'default' : path.replace(/^\/|\/$/g, '').replaceAll('/', '-'));

type Fm = { slug: string; h1: string; description: string };
const guides = Object.values(import.meta.glob<{ frontmatter: Fm }>('../pages/guides/*.md', { eager: true })).map((m) => m.frontmatter);

export function cards(): Card[] {
  return [
    {
      key: 'dgx-spark-64gb',
      kicker: '64 GB DGX Spark',
      title: 'What to run on a 64 GB DGX Spark',
      sub: 'Nemotron 3.5 Bolt at 110.8 tok/s and Qwen3.8-27B at 67.2 tok/s, measured at a 64 GB budget.',
      hue: '#84cc16',
    },
    { key: 'models', kicker: 'Models', title: 'Nine models, measured on a DGX Spark', sub: 'Qwen3.8-27B at 71.4 tok/s with a 1M context, a 176B on one box, images, and video with sound.' },
    ...lanes.map((l) => ({ key: `models-${l.slug}`, kicker: `A model by ${l.maker}`, title: `Run ${l.name} on a DGX Spark`, metric: `${l.value} ${l.unit}`, sub: l.what, hue: l.hue })),
    { key: 'machines', kicker: 'Machines', title: 'Every GB10 machine runs it', sub: 'DGX Spark, ASUS, Dell, HP, Lenovo, MSI, GIGABYTE and Acer, with 128 GB or 64 GB.' },
    ...machines.map((m) => ({ key: `machines-${m.slug}`, kicker: m.maker, title: `Local AI on the ${m.short}`, sub: 'Measured lanes, OpenAI and Anthropic APIs and a local cockpit, in one command.' })),
    { key: 'guides', kicker: 'Guides', title: 'Guides for DGX Spark owners', sub: 'Each one answers a question owners ask, with the source of every number.' },
    ...guides.map((g) => ({ key: `guides-${g.slug}`, kicker: 'Guide', title: g.h1, sub: g.description })),
  ];
}
