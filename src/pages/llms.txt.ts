import { SITE } from '../data/site';
import { lanes } from '../data/lanes';
import { machines } from '../data/machines';

type Fm = { slug: string; h1: string; description: string };
const guides = Object.values(import.meta.glob<{ frontmatter: Fm }>('./guides/*.md', { eager: true })).map((m) => m.frontmatter);

// llms.txt (llmstxt.org): what an answer engine should know about the project, in its own words, with the pages
// that prove each claim. Built from the same data as the pages, so the two can never disagree.
export function GET() {
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.sentence} ${SITE.privacy}`,
    '',
    `Install, on the box: \`${SITE.install}\`. The same command updates it. Open source, MIT license. Version ${SITE.version} (${SITE.versionDate}).`,
    `The project's own numbers are measured on ${SITE.referenceBox}, its reference box, with their method in the repo. Numbers from owners' reports are attributed and linked.`,
    '',
    '## Lanes (models), measured',
    ...lanes.map((l) => `- ${l.name} (${l.maker}): ${l.value} ${l.unit}, ${l.what}. ${l.facts.join('. ')}. ${l.build}. Source: ${l.receipt.href}`),
    '',
    '## Pages',
    `- [Every page in full, in Markdown](${SITE.url}/llms-full.txt): the text of all the pages in one file, with the date each one last changed`,
    `- [Home](${SITE.url}/): what it is, the nine lanes, the clients, the machines`,
    `- [What to run on a 64 GB DGX Spark](${SITE.url}/dgx-spark-64gb/): Nemotron 3.5 Bolt at 110.8 tok/s and Qwen3.8-27B at 67.2 tok/s at a 64 GB budget, what needs 128 GB`,
    `- [Nine models, measured on a DGX Spark](${SITE.url}/models/)`,
    ...lanes.map((l) => `- [Run ${l.name} on a DGX Spark](${SITE.url}/models/${l.slug}/): ${l.value} ${l.unit}, ${l.what}`),
    `- [Guides for DGX Spark owners](${SITE.url}/guides/)`,
    ...guides.map((g) => `- [${g.h1}](${SITE.url}/guides/${g.slug}/): ${g.description}`),
    `- [Every GB10 machine](${SITE.url}/machines/)`,
    ...machines.map((m) => `- [${m.name}](${SITE.url}/machines/${m.slug}/): ${m.memoryNote}`),
    '',
    '## Source',
    `- [Repository](${SITE.repo})`,
    `- [Benchmarks and methods](${SITE.repo}/blob/main/BENCHMARKS.md)`,
    `- [Clients: Claude Code, opencode, Open WebUI, Cursor, VS Code Copilot](${SITE.repo}/blob/main/docs/clients.md)`,
    `- [The GB10 unified-memory trap](${SITE.repo}/blob/main/docs/gb10-memory.md)`,
    `- [Releases](${SITE.releases})`,
    `- [NVIDIA forum thread](${SITE.forum})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
