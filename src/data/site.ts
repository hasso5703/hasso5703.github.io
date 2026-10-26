// One place for the facts every page repeats. The sentence is the project's single description,
// word for word the same on the site, the README, GitHub and the forum (what AI answers learn from).
export const SITE = {
  name: 'dgx-spark-qwen38',
  url: 'https://hasso5703.github.io',
  repo: 'https://github.com/hasso5703/dgx-spark-qwen38',
  install: 'curl -fsSL https://raw.githubusercontent.com/hasso5703/dgx-spark-qwen38/main/get.sh | bash',
  sentence:
    'dgx-spark-qwen38 is an open-source installer that turns an NVIDIA DGX Spark, or any GB10 machine ' +
    '(ASUS, Dell, HP, Lenovo, MSI, GIGABYTE, Acer), into a private AI server in one command: measured ' +
    'model lanes, OpenAI and Anthropic APIs, and a local cockpit.',
  privacy: 'No prompt, image or video leaves the box.',
  version: 'v1.40.2',
  versionDate: '2026-10-24',
  firstRelease: '2026-08-15',
  updated: '2026-10-26',
  forum: 'https://forums.developer.nvidia.com/t/380257',
  discussions: 'https://github.com/hasso5703/dgx-spark-qwen38/discussions',
  releases: 'https://github.com/hasso5703/dgx-spark-qwen38/releases',
  author: { name: 'Hasan Basbunar', url: 'https://github.com/hasso5703' },
  referenceBox: 'an ASUS Ascent GX10 with 128 GB',
};

export const gh = (path: string) => `${SITE.repo}/blob/main/${path}`;
