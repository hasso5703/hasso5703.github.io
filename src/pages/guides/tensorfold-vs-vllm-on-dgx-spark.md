---
layout: ../../layouts/Guide.astro
slug: tensorfold-vs-vllm-on-dgx-spark
title: "TensorFold vs vLLM on a DGX Spark: one checkpoint, measured"
description: "TensorFold 1.2.5 against vLLM on a DGX Spark, same 176B FP4 checkpoint: 69.7 against 55.3 tok/s alone, 80 s to load against 331 s, cold prefill 25% slower."
h1: "Is TensorFold faster than vLLM on a DGX Spark?"
published: "2026-11-10"
answer: "On one box and one checkpoint, yes for decoding and no for a cold prompt. With NVIDIA's Qwen3.8-Flash-Next FP4-Local (176B), TensorFold 1.2.5 decoded <strong>26% faster</strong> than vLLM alone (69.7 against 55.3 tok/s, greedy), loaded in 80 s against 331 s and kept 21.9 GiB of memory free at its lowest against 8.3. Its cold prefill was <strong>25% slower</strong> on a 133,370-token prompt. Measured on 2026-11-10. Alzeo still serves this lane on vLLM."
faq:
  - q: "Is TensorFold faster than vLLM on a DGX Spark?"
    a: "For one request at a time, yes on this checkpoint: a greedy median of 69.7 tok/s against 55.3 on short prompts, 26% more. At 8 streams it finished 200 GSM8K problems in 798 s against 968 s."
  - q: "Where is TensorFold slower?"
    a: "On a cold prompt. The first token of a 133,370-token prompt came after 75.7 s against 60.5 s for vLLM, 25% later, and the first turn of a 40,000-token conversation after 21.6 s against 17.7 s. Once the prefix is cached both answer in about 0.3 s."
  - q: "How much memory does TensorFold leave free?"
    a: "On the 128 GB reference box, MemAvailable never fell under 21.9 GiB with TensorFold at 8 streams, against 8.3 GiB with vLLM on the same checkpoint and probes."
  - q: "Which TensorFold settings were measured?"
    a: "Two: its defaults, which serve 2 streams at a time, and --parallel 8 with TF_FLASHNEXT_KV_PAGES=256 for a paged KV cache. Under load the second is the one to use: GSM8K at 8 at a time took 1,300 s with the defaults and 798 s with it."
  - q: "Does TensorFold change the quality of the answers?"
    a: "Not that this test could see. On 200 GSM8K problems at temperature 0 it scored 0.99 against 0.97 for vLLM, a gap of 4 problems, which is within the noise of a sample of 200."
  - q: "Does Alzeo install TensorFold?"
    a: "No. The Qwen3.8 Flash-Next FP4-Local lane is served by vLLM. Real coding agents, images, the 1M window and a long session were not measured on TensorFold, and nothing changes in Alzeo before they are."
sources:
  - label: "docs/flash-local-lane.md, the lane as Alzeo installs it"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/flash-local-lane.md"
  - label: "TensorFold, the project"
    href: "https://github.com/ashhart/TensorFold"
related:
  - label: "All guides"
    href: "/guides/"
  - label: "Which inference engine should you run on a DGX Spark?"
    href: "/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/"
  - label: "Is Tencent's DSpine worth running on a DGX Spark?"
    href: "/guides/tencent-dspine-on-dgx-spark/"
---

## What was compared?

Two engines on the same weights, on the reference box (an ASUS Ascent GX10, GB10, 128 GB), in one night: 2026-11-10, from 01:32 to 03:06. The checkpoint is `nvidia/Qwen3.8-Flash-Next-FP4-Local` at revision `b9ce18a`, the 176B model, with its window of 262,144 tokens. Three arms:

| Arm | Engine | Streams | Ready after |
|---|---|---|---|
| A | vLLM with NVIDIA's b12x kernels, the lane as Alzeo installs it | 8 | 331 s |
| B | TensorFold 1.2.5, its defaults | 2 | 85 s |
| C | TensorFold 1.2.5, `--parallel 8` and `TF_FLASHNEXT_KV_PAGES=256` (paged KV cache) | 8 | 80 s |

Each arm was loaded from cold and given the same probes in the same order. The box was left to cool below 60 °C before each load, each bench and each GSM8K run.

## What do the numbers say?

| | A: vLLM | B: TensorFold, defaults | C: TensorFold, 8 streams |
|---|---|---|---|
| `./bench.sh`, greedy median, three runs (tok/s) | 57.1, 55.3, 55.2 | 67.1, 69.6, 69.7 | 69.6, 69.7, 69.7 |
| Middle run | 55.3 | 69.6 | 69.7 |
| Code / reasoning / free prose, last run (tok/s) | 59 / 52 / 34 | 72 / 68 / 42 | 72 / 68 / 42 |
| 40,000-token conversation, first token of turn 1 (cold) | 17.7 s | 22.1 s | 21.6 s |
| The same conversation, turns 2 to 6 (prefix cache) | 0.34 to 0.40 s | 0.24 to 0.26 s | 0.25 to 0.26 s |
| 133,370-token prompt, cold, first token | 60.5 s | 75.6 s | 75.7 s |
| The same prompt sent again | 0.3 s | 0.3 s | 0.3 s |
| GSM8K, 200 problems, 8 at a time, temperature 0 | 0.97 in 968 s | 0.99 in 1,300 s | 0.99 in 798 s |
| Lowest MemAvailable during the run | 8.3 GiB | 23.2 GiB | 21.9 GiB |

## Where does TensorFold win?

- **Decoding, one request at a time: 26% faster.** 69.7 against 55.3 tok/s, and the three runs of each arm agree within 3 tok/s.
- **Eight streams: 18% sooner** on GSM8K with the paged KV cache (798 s against 968 s).
- **Memory: 13.6 to 14.9 GiB more left free** at the lowest point. On a machine with unified memory that is the distance between a relaxed box and one that sits 8 GiB from a freeze.
- **Loading: four times shorter**, 80 to 85 s against 331 s.

The two GSM8K scores, 0.99 and 0.97, are 4 problems apart on 200. That is not a difference this sample can show.

## Where does vLLM win?

- **Cold prefill.** A 133,370-token prompt took 60.5 s to its first token on vLLM and 75.6 to 75.7 s on TensorFold, 25% longer. The first turn of a 40,000-token conversation took 17.7 s against 21.6 to 22.1 s. An agent that opens with a long context feels this first.
- **Defaults under load.** TensorFold's default of 2 streams took 1,300 s on the GSM8K run that vLLM finished in 968 s. With `--parallel 8` and the paged KV cache it took 798 s.

Once a prefix is cached, both engines bring a turn back in well under a second: 0.34 to 0.40 s on vLLM and 0.24 to 0.26 s on TensorFold.

## How hot did the box get?

No power-off, with an external fan on the box. The hottest thermal zone peaked at 94.4 °C under vLLM (during GSM8K), and at 96.8 °C and 97.5 °C under the two TensorFold arms, during the long prompt, when the GPU drew 90 W in prefill. Watch the ACPI zones if you repeat this: this box powered off at 96.4 °C the evening before, without the fan.

## What was not measured?

Real clients and coding agents through the proxy (key, abort, reasoning and tool calls), the prefix-cache behaviour of agent harnesses, images (this lane serves text and images), the 1M window, a long session, and sampled answers read one by one. One difference showed in the checks: TensorFold streams its reasoning as `reasoning_content`, where this vLLM lane uses `reasoning`.

TensorFold is published under Apache-2.0. The run left the checkpoint untouched, wrote nothing outside its own folder and made no network connection.

## Should you switch?

These numbers are one night on one machine and one checkpoint. They say TensorFold deserves a full trial on a DGX Spark: faster decoding, much more memory left and a shorter load, for a slower cold prefill. They do not say it is ready to replace vLLM under real agents. Alzeo serves this lane on vLLM, and will not change that before the list above is measured.
