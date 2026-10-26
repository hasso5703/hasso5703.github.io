import { gh } from './site';

// Every number here is copied from the repo's BENCHMARKS.md table « Every lane today, on the reference box »
// (v1.40.2) or the README section it links, never rounded and never improved. The receipt says where. The
// load steps are the README's own, lane by lane (cockpit Load times included).
export type Lane = {
  id: string;
  slug: string;
  name: string;
  maker: string;
  logo: string;
  hue: string;
  kind: string;
  about: string;
  value: string;
  unit: string;
  what: string;
  facts: string[];
  build: string;
  fits64: string;
  load: { cockpit?: string; prepare?: string; target: string; variants?: string };
  titleFact?: string;
  local?: { port: number; view: string };
  receipt: { method: string; source: string; href: string };
};

export const lanes: Lane[] = [
  {
    id: '27b', slug: 'qwen3-8-27b', name: 'Qwen3.8-27B', maker: 'Qwen', logo: '/img/logos/qwen.svg', hue: '#8c6cff',
    kind: 'Text and code, a 1M-token window',
    about: "Qwen's 27B in NVFP4, served by SGLang with a DFlash2 drafter, with a window of a million tokens.",
    value: '71.4', unit: 'tok/s', what: 'greedy median, one request',
    facts: ['135 to 148 tok/s in all at 8 streams', 'A window of a million tokens', 'GSM8K 94.0% on 200 problems'],
    build: 'NVFP4 with a DFlash2 drafter, on SGLang',
    fits64: 'Yes, without the 1M window: two requests at a time, 59,625 tokens of KV (one prompt of up to 54,855 tokens), 67.2 tok/s greedy median, measured at a 64 GB budget on the reference box.',
    load: { target: 'stock', variants: 'fp8, uncensored, uncensored-fp8' },
    receipt: { method: './bench.sh, the v1.14.0 campaign', source: 'BENCHMARKS.md', href: gh('BENCHMARKS.md') },
  },
  {
    id: 'flash', slug: 'qwen3-8-flash-next-176b', name: 'Qwen3.8-Flash-Next 176B', maker: 'Qwen', logo: '/img/logos/qwen.svg', hue: '#38bdf8',
    kind: 'A 176B mixture of experts on one box',
    about: "Qwen's 176B mixture of experts in NVFP4 on one box, at its full 262K window: its 47.7 GiB FP8 N-gram table lives in a sparse file on the local NVMe, so the memory goes to the weights and a real KV cache.",
    value: '47.9', unit: 'tok/s', what: 'on code, with FLASH_TIER=context',
    facts: ['A 262K-token window', 'GSM8K 97.41% on 1,314 problems', 'HumanEval 95.73%, MMLU 90.8%'],
    build: 'NVFP4 with NEXTN speculation, on SGLang',
    fits64: 'No: it needs a 128 GB DGX Spark.',
    load: { target: 'flash', variants: 'flash-nvda, flash-uncensored' },
    receipt: { method: 'the flash lane campaign', source: 'docs/flash-lane.md', href: gh('docs/flash-lane.md') },
  },
  {
    id: 'flash-local', slug: 'flash-fp4-local', name: 'Flash FP4-Local', maker: 'NVIDIA', logo: '/img/logos/nvidia.svg', hue: '#22d3ee',
    kind: 'The FP4 build of the flash model',
    about: "NVIDIA's FP4 build of the Flash-Next, on vLLM: the flash lane's quality in about half its disk, with twice its KV cache.",
    value: '55.4', unit: 'tok/s', what: 'greedy median, at its default effort',
    facts: ['106.6 tok/s in all at 8 streams, at the lean effort', 'GSM8K 97.64% on 1,314 problems', 'About half the disk of the flash lane'],
    build: 'on vLLM',
    fits64: 'No: it needs a 128 GB DGX Spark.',
    load: { cockpit: '17 to 19 minutes to answer the first time, about 5 and a half after', prepare: 'flash-local', target: 'flash-local' },
    receipt: { method: './bench.sh at the xhigh effort', source: 'docs/flash-local-lane.md', href: gh('docs/flash-local-lane.md') },
  },
  {
    id: 'bolt', slug: 'nemotron-3-5-bolt', name: 'Nemotron 3.5 Bolt', maker: 'NVIDIA', logo: '/img/logos/nvidia.svg', hue: '#84cc16',
    kind: 'A 74B that reads images and video',
    about: "NVIDIA's 74B that reads images and video, in a 24 GB checkpoint, on vLLM with its drafter.",
    value: '140', unit: 'tok/s', what: 'rewriting code, one request, reasoning off',
    facts: ['201.2 tok/s in all at 16 streams', 'Reads images and video', 'The lane a 64 GB Spark serves first'],
    build: 'with its drafter, on vLLM',
    fits64: 'Yes, it is the lane a 64 GB box serves: 110.8 tok/s greedy median and 667,874 tokens of KV, measured at a 64 GB budget on the reference box.',
    load: { cockpit: 'about 8 minutes to answer', prepare: 'nemotron', target: 'nemotron' },
    receipt: { method: 'the Bolt lane campaign', source: 'docs/nemotron-lane.md', href: gh('docs/nemotron-lane.md') },
  },
  {
    id: 'super', slug: 'nemotron-3-5-super-vl', name: 'Nemotron 3.5 Super VL', maker: 'NVIDIA', logo: '/img/logos/nvidia.svg', hue: '#eab308',
    kind: 'A 120B with vision and a 1M-token window',
    about: "NVIDIA's 120B with vision and a window of a million tokens, on vLLM with its drafter.",
    value: '69.5', unit: 'tok/s', what: 'rewriting code, one request, reasoning off',
    facts: ['81.7 tok/s in all at 4 streams', 'A window of a million tokens', 'Reads images and video'],
    build: 'with its drafter, on vLLM',
    fits64: 'No: it needs a 128 GB DGX Spark.',
    load: { cockpit: 'about 9 to 11 minutes to answer', prepare: 'nemotron-super', target: 'nemotron-super' },
    receipt: { method: 'the Super VL lane campaign', source: 'docs/nemotron-super-lane.md', href: gh('docs/nemotron-super-lane.md') },
  },
  {
    id: 'ornith', slug: 'ornith-1-5-122b', name: 'Ornith 1.5 122B', maker: 'Ornith AI', logo: '/img/logos/ornith.svg', hue: '#f87171',
    kind: 'A 122B mixture of experts with vision',
    about: "Ornith AI's 122B mixture of experts with vision and a window of a million tokens, in NVFP4 on vLLM with its MTP head.",
    value: '42.4', unit: 'tok/s', what: 'greedy median, one request',
    facts: ['90.0 tok/s in all at 8 streams on five real jobs', 'GSM8K 98.8% on 250 problems, on a second GX10', 'A window of a million tokens'],
    build: 'NVFP4 with its MTP head, on vLLM',
    fits64: 'No: it needs a 128 GB DGX Spark.',
    load: { cockpit: '5 and a half minutes the first time, 2 to 4 after', prepare: 'ornith-122b', target: 'ornith-122b' },
    receipt: { method: './bench.sh', source: 'docs/ornith-lane.md', href: gh('docs/ornith-lane.md') },
  },
  {
    id: 'kolibri', slug: 'kolibri-1', name: 'Kolibri-1', maker: 'Aleph Alpha', logo: '/img/logos/alephalpha.svg', hue: '#34d399',
    kind: 'German and English',
    about: "Aleph Alpha's model for German and English, in its official FP8 weights on vLLM. It needs about 102 GB of disk, installed on demand.",
    value: '48.0', unit: 'tok/s', what: 'one request',
    facts: ['121.9 tok/s at 4 streams', '165.8 at 8, 202.0 at 16', "Aleph Alpha's FP8 weights"],
    build: 'FP8, on vLLM',
    fits64: 'No: it needs a 128 GB DGX Spark.',
    load: { cockpit: 'about 10 minutes to answer', prepare: 'kolibri', target: 'kolibri' },
    receipt: { method: 'the Kolibri lane campaign', source: 'docs/kolibri-lane.md', href: gh('docs/kolibri-lane.md') },
  },
  {
    id: 'image', slug: 'qwen-image-2-1', name: 'Qwen-Image 2.1', maker: 'Qwen', logo: '/img/logos/qwen.svg', hue: '#f472b6',
    kind: 'Images from a prompt',
    about: "Qwen's image model on SGLang. Its Turbo, Qwen's eight-step distillation of the same model, is a second checkpoint of the lane.",
    value: '7.5', unit: 's', what: 'with its Turbo, per 1024×1024 image',
    facts: ['34.3 s at 40 steps without it', 'The Turbo fetches 32.5 GB at its first switch', 'On the same box as the text lanes'],
    build: 'on SGLang',
    fits64: 'No: it needs a 128 GB DGX Spark.',
    load: { prepare: 'image', target: 'image', variants: 'image-turbo' },
    titleFact: '7.5 s per image, measured',
    local: { port: 30020, view: 'Image' },
    receipt: { method: '1024×1024, timed on the box', source: 'docs/image-lane.md', href: gh('docs/image-lane.md') },
  },
  {
    id: 'video', slug: 'minimax-h3', name: 'MiniMax-H3', maker: 'MiniMax', logo: '/img/logos/minimax.svg', hue: '#fb923c',
    kind: 'Video with sound',
    about: "MiniMax's video model, which makes the sound with the picture, served with the SGLang cookbook's MiniMax-H3 recipe as upstream wrote it.",
    value: '126.2 to 127.9', unit: 's', what: 'with the Turbo adapter, for 4 s of 480P video',
    facts: ['622.8 to 632.5 s at 50 steps without it', 'Sound made with the picture', 'From a sentence'],
    build: 'on SGLang',
    fits64: 'No: it needs a 128 GB DGX Spark.',
    load: { prepare: 'video', target: 'video' },
    titleFact: '4 s of video in 126.2 to 127.9 s',
    local: { port: 30022, view: 'Video' },
    receipt: { method: '4 s at 480P, timed on the box', source: 'docs/video-lane.md', href: gh('docs/video-lane.md') },
  },
];
