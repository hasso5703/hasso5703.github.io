// One place for the facts every page repeats. The sentence is the project's single description,
// word for word the same on the site, the README, GitHub and the forum (what AI answers learn from).
export const SITE = {
  name: 'Alzeo',
  formerName: 'dgx-spark-qwen38',   // its name until 2026-11-01: people still search for it
  url: 'https://alzeo.ai',
  repo: 'https://github.com/hasso5703/alzeo',
  install: 'curl -fsSL https://get.alzeo.ai | bash',
  sentence:
    'Alzeo is an open-source installer that turns an NVIDIA DGX Spark, or any GB10 machine ' +
    '(ASUS, Dell, HP, Lenovo, MSI, GIGABYTE, Acer), into a private AI server in one command: measured ' +
    'model lanes, OpenAI and Anthropic APIs, and a local cockpit.',
  privacy: 'No prompt, image or video leaves the box.',
  version: 'v1.46.1',
  versionDate: '2026-11-10',
  firstRelease: '2026-08-15',
  updated: '2026-11-10',
  forum: 'https://forums.developer.nvidia.com/t/380257',
  discussions: 'https://github.com/hasso5703/alzeo/discussions',
  releases: 'https://github.com/hasso5703/alzeo/releases',
  author: { name: 'Hasan Basbunar', url: 'https://github.com/hasso5703' },
  referenceBox: 'an ASUS Ascent GX10 with 128 GB',
};

export const gh = (path: string) => `${SITE.repo}/blob/main/${path}`;
