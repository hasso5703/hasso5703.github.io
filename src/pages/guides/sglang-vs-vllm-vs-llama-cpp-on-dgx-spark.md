---
layout: ../../layouts/Guide.astro
slug: sglang-vs-vllm-vs-llama-cpp-on-dgx-spark
title: "SGLang vs vLLM vs llama.cpp on DGX Spark: measured on one box"
description: "SGLang, vLLM and llama.cpp on one DGX Spark: the drafter and the content matter more than the engine. Code: 28-32 tok/s SGLang with DSpark, 25-26 llama.cpp."
h1: "Which inference engine should you run on a DGX Spark?"
published: "2026-10-26"
answer: "On a DGX Spark the drafter and what you generate matter more than the engine: with the same Qwen3.8-27B checkpoint and the same drafter, an owner's vLLM run and this repo's SGLang landed in the same band. On the same battery, a block drafter on SGLang led on code (<strong>28-32 tok/s</strong>, against 25-26 for tuned llama.cpp), while plain MTP heads held up better on free prose. This installer runs Qwen3.8-27B and Flash-Next on SGLang and five other lanes on vLLM, chosen model by model."
faq:
  - q: "Is vLLM or SGLang faster on a DGX Spark?"
    a: "Neither on every job. With the same Qwen3.8-27B checkpoint and drafter they landed in the same band, and on Ornith 1.5 122B SGLang was faster alone on code, reasoning and math, vLLM on free prose, and the two came within 6% of each other at 4 and 8 requests."
  - q: "Is llama.cpp slower than SGLang on a DGX Spark?"
    a: "On the same Qwen3.8-27B and the same battery, tuned llama.cpp measured 25.6 tok/s on agentic coding against 32-40 for SGLang with the v1.2 DFlash2 drafter, and 17.7 to 18.2 tok/s on prose against 17 to 22. It runs well on GB10 and is the engine to reach for when a fine-tune only exists as GGUF."
  - q: "Why is free prose slower than code?"
    a: "A drafter only pays when the model accepts its tokens, and prose is less predictable than code. On the reference box English free prose ran 2x slower than English code on the same setup, and German ran slower than French, which ran slower than English."
  - q: "Does speculative decoding change the answers?"
    a: "No. The verify step only accepts tokens the target model would have emitted, so the output stays the model's own and only the speed changes."
  - q: "Which engines does this installer use?"
    a: "SGLang for Qwen3.8-27B, Qwen3.8-Flash-Next and the image and video lanes, vLLM for Flash FP4-Local, Kolibri-1, Nemotron 3.5 Bolt, Nemotron 3.5 Super VL and Ornith 1.5 122B, and llama.cpp for the opt-in speech recognition on the CPU."
  - q: "Will I get the same numbers on my Spark?"
    a: "Not exactly. They are point-in-time measurements on one machine, and acceptance lengths, so tok/s, vary with workload and language. ./bench-matrix.sh runs the same frozen battery against any engine on your own box."
sources:
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/BENCHMARKS.md"
  - label: "README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md"
  - label: "docs/ornith-lane.md, the engine"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/ornith-lane.md#the-engine-vllm-with-the-models-own-mtp-head"
  - label: "extras/gguf/README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/extras/gguf/README.md"
  - label: "CHANGELOG.md, v1.5"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/CHANGELOG.md"
  - label: "docs/speech-lane.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/speech-lane.md"
related:
  - label: "All guides"
    href: "/guides/"
  - label: "Every GB10 machine runs it"
    href: "/machines/"
  - label: "What to run on a 64 GB DGX Spark"
    href: "/dgx-spark-64gb/"
---

## Which engine is fastest on a DGX Spark?

None on every job, and the hardware explains why. Single-stream decode of a dense model on a GB10 is bound by memory bandwidth: the chip advertises 273 GB/s, about 225 GB/s is measurable, and every decode step reads all the weights. Two levers move the result: the bytes each step reads (the quantization) and the tokens each step accepts (speculative decoding, where a drafter proposes tokens and the model verifies them, so the output does not change).

An outside owner ran this repo's battery on vLLM 0.27-dev with the same pinned Qwen3.8-27B NVFP4 checkpoint and DSpark drafter, on an idle box. The prose floor was identical, and the structured cells sat 15-25% above this repo's, which were measured on a box serving its own agent sessions at the time. The repo's reading: with identical hardware, quantization and drafter, that vLLM path and SGLang land in the same band, and box load and content are the levers.

## How do SGLang, vLLM and llama.cpp compare on the same model?

On the reference box, an ASUS Ascent GX10, the repo first ran Qwen3.8-27B through all three engines on the same day in August 2026:

| Engine and config | Code and math, French prompts | Eval-style, English |
|---|---|---|
| llama.cpp UD-Q4_K_XL + MTP n=3, tuned | ~27 tok/s | 24-30 tok/s |
| vLLM 0.27 NVFP4 + MTP n=3, official recipe | ~24.5 tok/s | n/a |
| SGLang NVFP4 + DSpark (this repo, v1.0-v1.1) | ~34 tok/s | 38.0 average, 46.7 peak |

Then came its frozen battery (`./bench-matrix.sh`, greedy), with SGLang driving the checkpoint's own MTP head as a control:

| Workload (tok/s) | SGLang + DSpark | SGLang + MTP | llama.cpp + MTP n=3, tuned |
|---|---|---|---|
| Math word problems (EN) | 37-38 | 27.7 | n/a |
| Code (EN) | 28-32 | 23.3 | 25-26 |
| Code (DE) | 24-25 | 24.1 | 21-25 |
| Reasoning (FR) | 31.6 | 30.3 | 27-28 |
| Free prose (EN) | 16 | 20.1 | 17.7 |
| Free prose (FR) | 13 | 20.8 | 18.2-18.4 |
| Free prose (DE) | 12.3 | 18.8 | 17-18 |

The block drafter has the highest ceiling on structured output and a floor on prose. The MTP engines sit in a stable middle, and SGLang with MTP was the best of them on prose, ahead of llama.cpp there too. The repo's GGUF note adds prefill, which an agent loop feels first: its SGLang speculative path measured about 3x ahead of the stable-MTP engines it was compared with, llama.cpp among them.

Drafters kept improving. With the calibrated NVFP4 DFlash2 drafter the 27B lane has served since v1.9, the same battery measured 40 tok/s on English code and 34 on German, and 22 / 20 / 18 on prose in English, French and German, against 24-28 and 17-20 for the stable-MTP engines. The lane's headline today is a 71.4 tok/s greedy median on `./bench.sh`.

## Does what you generate change the speed?

More than the engine does. An independent owner A/B'd this repo's config against vLLM 0.26.1 with MTP on one machine, engine and checkpoint changing together: SGLang led the code probe, 32.8 against 25.1 tok/s, and vLLM led six mixed prompts, half in German, 24.7 against 19.5. vLLM's MTP head kept acceptance stable (4.35-4.77) on everything they tried, while the separate DSpark drafter accepted 2.80-5.42 tokens on the repo's probes and 1.25-1.52 on German prose. The repo reproduced the effect on its own box:

| Content | tok/s | Mean accept length |
|---|---|---|
| Code, English prompt | 32.9-40.5 | 3.3 |
| Code, German prompt | 22.9 | 2.6 |
| Technical explanation, French | 18.4 | 2.2 |
| Free prose, English | 16.6 | 2.1 |
| Free prose, French | 13.7 | 1.9 |
| Free prose, German | 12.2 | 1.5-1.7 |
| Math word problems, eval-style (temp 0.6) | 43-47 | ~4.9 |

Content type comes first: English free prose ran 2x slower than English code on the same setup. Language comes second, English ahead of French ahead of German. In the owner's A/B, the latency edge did not depend on content: time to first token on text was 0.22-0.28 s on SGLang against 0.33-0.34 s on vLLM.

## Is SGLang or vLLM better for the same model?

On Ornith 1.5 122B the repo ran both engines one after the other on the same night, each with its own drafter, at the model's native window:

| Ornith 1.5 122B | vLLM, MTP drafting 2 | SGLang nightly, DFlash2 drafting 8 |
|---|---|---|
| One request: code / free prose | 42.2 / 30.8-32.2 tok/s | 53.7-53.8 / 25.2-25.3 tok/s |
| One request: reasoning / math | 42.5-43.3 / 41.1-42.7 tok/s | 65.8-67.6 / 69.8-74.5 tok/s |
| Five real jobs, 4 / 8 at a time | 64.2 / 88.3 tok/s | 63.0 / 93.2 tok/s |
| KV cache at a window of a million | 1,301,680 tokens | 566,943 tokens |
| Boot, caches made | 2 min 46 s to 3 min 46 s | 11 min 30 s to 11 min 51 s |

SGLang's drafter wins where text is predictable and one request runs alone. vLLM wins on free prose and random tokens, holds the whole window and boots four times faster, and at 4 and 8 requests the two are within 6%. SGLang brings an agent's returning turn back from its cache in 0.2 to 0.3 s, against 5.3 to 5.6 s for vLLM, which an option of that vLLM build later cut to 0.54 to 0.58 s on a second GX10.

The two Flash-Next lanes also split the wins (different builds of the model, so not a pure engine test): vLLM was faster alone (47.4 against 43.8 tok/s) and in prefill (2,141 against 1,617 tok/s on a 32K prompt), SGLang at 8 requests (123.7 against 106.6).

## Which engine does this installer run for each lane, and why?

| Lane | Engine | Why |
|---|---|---|
| Qwen3.8-27B (four targets) | SGLang + DFlash2 | the fastest configuration the repo measured for it |
| Qwen3.8-Flash-Next 176B (three targets) | SGLang + NEXTN | moved from vLLM in v1.5 (August 2026), when prefix caching worked on SGLang and a GB10 bug blocked it on vLLM: a 30K-token conversation came back in 0.5 s instead of 18.4 s |
| Flash FP4-Local | vLLM | NVIDIA's build of Flash-Next, run with the command its model card gives for a DGX Spark |
| Kolibri-1 | vLLM + Aleph Alpha's plugin | SGLang cannot load it |
| Nemotron 3.5 Bolt, Super VL | vLLM | the way NVIDIA's model cards serve them on a DGX Spark |
| Ornith 1.5 122B | vLLM | the whole million-token window, a speed that holds on any text, a shorter boot |
| Qwen-Image 2.1, MiniMax-H3 video | SGLang | video follows the SGLang cookbook's recipe, verified on the DGX Spark |
| Speech recognition (opt-in) | llama.cpp `llama-server`, on the CPU | no GPU memory, so it runs beside any lane |

## Which engine should you pick?

- **Agentic coding, tool calls, math, structured reasoning**: SGLang with a block drafter, which won every relevant row of the same-battery comparison.
- **Mostly free prose or mixed languages**: measure the drafter on your own content. A plain MTP head beat the August block drafter on prose, the 27B's current drafter closed that gap, and on Ornith vLLM's MTP head still led free prose.
- **Long windows, any kind of text, quick restarts**: vLLM, on the Ornith numbers.
- **A fine-tune that only exists as GGUF**: llama.cpp runs well on GB10, at 25.6 tok/s on agentic coding against 32-40 for SGLang with the v1.2 DFlash2 drafter on the same 27B.

The repo's numbers are point-in-time measurements on one machine, and your acceptance lengths, so your tok/s, will vary with workload and language. `./bench-matrix.sh` runs the same frozen battery against any engine on your own box.
