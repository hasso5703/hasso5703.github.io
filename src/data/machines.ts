// Every GB10 machine on sale on 2026-10-26 that runs NVIDIA's DGX OS. Names as their makers write them, then the
// names owners use on the forums, so a search for either finds the page. Sources: each maker's own page, NVIDIA's
// blog of 2026-10-02 for the 64 GB configurations, and ~/visibilite/site-20261026/RECHERCHE.md (checked by hand).
export type Machine = {
  slug: string;
  name: string;
  short: string;
  titleName?: string;
  maker: string;
  aka: string[];
  memory: Array<'64' | '128'>;
  memoryNote: string;
  official: string;
  tested?: string;
};

export const machines: Machine[] = [
  {
    slug: 'nvidia-dgx-spark',
    name: 'NVIDIA DGX Spark',
    short: 'NVIDIA DGX Spark',
    maker: 'NVIDIA',
    aka: ['DGX Spark', 'Spark', 'DGX Spark Founders Edition'],
    memory: ['128'],
    memoryNote: "128 GB from NVIDIA. Since October 23, 2026, NVIDIA's partners also sell 64 GB configurations.",
    official: 'https://www.nvidia.com/en-us/products/workstations/dgx-spark/',
  },
  {
    slug: 'asus-ascent-gx10',
    name: 'ASUS Ascent GX10',
    short: 'ASUS Ascent GX10',
    maker: 'ASUS',
    aka: ['GX10', 'Ascent GX10'],
    memory: ['128', '64'],
    memoryNote: 'Sold with 128 GB, and with 64 GB since October 2026.',
    official: 'https://www.asus.com/networking-iot-servers/desktop-ai-supercomputer/ultra-small-ai-supercomputers/asus-ascent-gx10/',
    tested:
      'The reference box of the project: every measurement of the project was made on an ASUS Ascent GX10 with 128 GB, ' +
      'and a second GX10 was set up from scratch with the one command.',
  },
  {
    slug: 'dell-pro-max-gb10',
    name: 'Dell Pro Precision with GB10',
    short: 'Dell Pro Precision GB10',
    titleName: 'Dell Pro Precision GB10 (Pro Max)',
    maker: 'Dell',
    aka: ['Dell Pro Max with GB10', 'Dell Pro Max GB10', 'FCM1253'],
    memory: ['128', '64'],
    memoryNote: 'Launched as the Dell Pro Max with GB10, now named Dell Pro Precision with GB10 on dell.com, configured with 64 GB or 128 GB.',
    official: 'https://www.dell.com/en-us/shop/desktop-computers/dell-pro-max-with-gb10/spd/dell-pro-max-fcm1253-micro',
  },
  {
    slug: 'hp-zgx-nano-g1n',
    name: 'HP ZGX Nano G1n AI Station',
    short: 'HP ZGX Nano G1n',
    maker: 'HP',
    aka: ['HP ZGX Nano', 'ZGX Nano AI Station'],
    memory: ['128'],
    memoryNote: "128 GB on HP's US page. NVIDIA lists HP among the partners selling 64 GB configurations.",
    official: 'https://www.hp.com/us-en/workstations/zgx-nano-ai-station.html',
  },
  {
    slug: 'lenovo-thinkstation-pgx',
    name: 'Lenovo ThinkStation PGX',
    short: 'Lenovo ThinkStation PGX',
    maker: 'Lenovo',
    aka: ['ThinkStation PGX', 'Lenovo PGX'],
    memory: ['128'],
    memoryNote: '128 GB.',
    official: 'https://lenovopress.lenovo.com/lp2321-thinkstation-pgx',
  },
  {
    slug: 'msi-edgexpert',
    name: 'MSI EdgeXpert',
    short: 'MSI EdgeXpert',
    maker: 'MSI',
    aka: ['EdgeXpert MS-C931', 'MSI Edge Expert'],
    memory: ['128', '64'],
    memoryNote: 'Sold with 128 GB, and with 64 GB since October 23, 2026.',
    official: 'https://www.msi.com/Landing/EdgeXpert-MS-C931',
  },
  {
    slug: 'gigabyte-ai-top-atom',
    name: 'GIGABYTE AI TOP ATOM',
    short: 'GIGABYTE AI TOP ATOM',
    maker: 'GIGABYTE',
    aka: ['Gigabyte AI Top Atom', 'AI TOP ATOM'],
    memory: ['128', '64'],
    memoryNote: 'Sold with 128 GB, and with 64 GB since October 2026.',
    official: 'https://www.gigabyte.com/AI-TOP-PC/GIGABYTE-AI-TOP-ATOM',
  },
  {
    slug: 'acer-veriton-gn100',
    name: 'Acer Veriton GN100 AI Mini Workstation',
    short: 'Acer Veriton GN100',
    maker: 'Acer',
    aka: ['Acer Veriton GN100', 'GN100'],
    memory: ['128', '64'],
    memoryNote: 'Sold with 128 GB or 64 GB.',
    official: 'https://www.acer.com/us-en/desktops-and-all-in-ones/veriton-workstations/veriton-gn100-ai-mini-workstation',
  },
];
