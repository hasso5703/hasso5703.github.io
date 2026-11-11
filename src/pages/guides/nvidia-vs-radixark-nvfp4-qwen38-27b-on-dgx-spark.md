---
layout: ../../layouts/Guide.astro
slug: nvidia-vs-radixark-nvfp4-qwen38-27b-on-dgx-spark
title: "NVIDIA vs RadixArk NVFP4 of Qwen3.8-27B on a DGX Spark"
description: "Two NVFP4 builds of Qwen3.8-27B on one DGX Spark, same engine and flags: same speed, same memory, MMLU 437 against 446 of 500. Neither is the better pick."
h1: "Which NVFP4 build of Qwen3.8-27B should you run on a DGX Spark?"
published: "2026-11-11"
answer: "Either one: on the same box, engine and flags, the two measured the same. NVIDIA's build decoded alone at 66.4 and 69.6 tok/s against 64.8 and 69.1 for RadixArk's, kept the same memory free and the same KV pool, and scored 246, 437 and 156 against 248, 446 and 157 on GSM8K, MMLU and HumanEval, gaps that one pass cannot tell from noise. NVIDIA's is <strong>a little closer to the FP8 reference</strong> token by token (7% less divergence), which the benchmarks do not show. Alzeo keeps RadixArk's, the one its 27B lane already serves."
faq:
  - q: "Is NVIDIA's NVFP4 of Qwen3.8-27B better than RadixArk's on a DGX Spark?"
    a: "Not on this test. On GSM8K, MMLU and HumanEval it scored 246, 437 and 156 against 248, 446 and 157, at the same speed and with the same memory. No benchmark separates the two on its own (McNemar p = 0.50, 0.09 and 1.00)."
  - q: "Which one is faster?"
    a: "Neither. Alone, the greedy median was 66.4 and 69.6 tok/s on two loads of NVIDIA's build against 64.8 and 69.1 for RadixArk's. With four prompts sent at once, 56.6 and 53.8 against 54.4 and 55.1. The gap between two loads of one build is as large as the gap between the builds."
  - q: "Which one is closer to the FP8 model?"
    a: "NVIDIA's, by a little. On 30 fixed texts its mean divergence from Qwen's FP8 checkpoint was 0.0638 against 0.0688, 7% less, and its first choice agreed with FP8's on 90.2% of positions against 89.3%."
  - q: "Do the two use the same memory?"
    a: "Yes, once both declare an FP8 KV cache. The KV pool held 873,248 and 881,931 tokens with NVIDIA's build against 882,224 and 896,305 with RadixArk's, 1 to 2% less, which is also what the pool moved between two loads of one build. Both were ready in about 220 s."
  - q: "What is different in NVIDIA's files?"
    a: "As published, they do not declare the FP8 KV cache that RadixArk's declare. Served as they are under SGLang they get a BF16 cache, twice the bytes per token for the model's own cache. For this comparison NVIDIA's build was given the same declaration."
  - q: "Which one does Alzeo install?"
    a: "RadixArk/Qwen3.8-27B-NVFP4, as before. The rule was to switch only if NVIDIA's build measured better, and it did not."
sources:
  - label: "nvidia/Qwen3.8-27B-NVFP4 on Hugging Face"
    href: "https://huggingface.co/nvidia/Qwen3.8-27B-NVFP4"
  - label: "RadixArk/Qwen3.8-27B-NVFP4 on Hugging Face"
    href: "https://huggingface.co/RadixArk/Qwen3.8-27B-NVFP4"
  - label: "docs/gb10-memory.md, how the 27B lane shares the box's memory"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/gb10-memory.md"
related:
  - label: "All guides"
    href: "/guides/"
  - label: "Is TensorFold faster than vLLM on a DGX Spark?"
    href: "/guides/tensorfold-vs-vllm-on-dgx-spark/"
  - label: "Which inference engine should you run on a DGX Spark?"
    href: "/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/"
---

## What was compared?

Two NVFP4 quantizations of the same model, on the reference box (an ASUS Ascent GX10, GB10, 128 GB), in one night: 2026-11-11, from 00:27 to 03:24.

| Arm | Checkpoint | Role |
|---|---|---|
| A | `RadixArk/Qwen3.8-27B-NVFP4` at revision `52d1adc` | the one Alzeo's 27B lane serves |
| B | `nvidia/Qwen3.8-27B-NVFP4` at revision `482ca0f` | the candidate |
| C | `Qwen/Qwen3.8-27B-FP8` at revision `017b9c7` | the reference for token probabilities only |

Every arm ran in the SGLang image of Alzeo's 27B lane, with the lane's own command line and its draft model (speculative decoding). The order was A, B, C, B, A, each from a fresh start of the engine, so that a drift of the box over the night would not favor one arm. The box was left to cool below 60 °C before each load and each bench.

Two things were made equal first, because the two repositories do not ship the same `config.json`:

- **The 1M window.** Alzeo serves the 27B with YaRN and a window of 1,010,000 tokens. NVIDIA's `config.json` received the same four keys as RadixArk's, on a copy.
- **The KV cache.** RadixArk's files declare an FP8 KV cache, NVIDIA's do not. Served as published, NVIDIA's build gets a BF16 cache: twice the bytes per token for the model's own cache, and by the sizes of the caches a pool of about 0.62 of the other (an estimate, not measured here). For this comparison it was given the same declaration.

A check of the bench itself: arm A gave back the token probabilities recorded on the production 27B on 2026-11-02 (no difference at any of the 30,690 positions).

## What do the numbers say?

| | A: RadixArk | B: NVIDIA |
|---|---|---|
| Ready after a load (two loads) | 220 s, 220 s | 223 s, 220 s |
| KV pool (two loads) | 882,224 and 896,305 tokens | 873,248 and 881,931 tokens |
| Lowest MemAvailable while serving (two loads) | 18.0 and 20.8 GiB | 19.0 and 21.6 GiB |
| 1 stream, greedy, median of code and reasoning (two loads) | 64.8 and 69.1 tok/s | 66.4 and 69.6 tok/s |
| Four prompts sent at once, median of the code and reasoning streams (two loads) | 54.4 and 55.1 tok/s | 56.6 and 53.8 tok/s |
| Draft acceptance length, 1 stream (two loads) | 3.99 and 3.85 | 4.10 and 4.03 |
| GSM8K, 250 problems | 248 right (0.992) | 246 right (0.984) |
| MMLU, 500 questions | 446 right (0.892) | 437 right (0.874) |
| HumanEval, 164 problems | 157 right (0.957) | 156 right (0.951) |
| A passphrase hidden at 120,000 and at 300,000 tokens | 2 of 2 found | 2 of 2 found |
| 32 sampled answers, four sampling settings | 0 with a defect | 0 with a defect |
| Thinking tokens over 20 prompts, default effort | 2,530 | 2,239 |

Speed, memory and the pool are the same. Where two loads of one build differ by 4 tok/s, a gap of 2 between the builds says nothing.

## Is the gap on MMLU real?

Nine questions of 500 is the largest gap of the night, and it is not enough to conclude. Question by question:

| Bench | Both right | Only A right | Only B right | Neither | McNemar, exact p |
|---|---|---|---|---|---|
| GSM8K | 246 | 2 | 0 | 2 | 0.50 |
| MMLU | 430 | 16 | 7 | 47 | 0.09 |
| HumanEval | 154 | 3 | 2 | 5 | 1.00 |

No bench separates the two builds on its own. Put together after the fact, the three give 21 questions to A alone against 9 to B alone (p = 0.04): a hint in favor of RadixArk's build, not a proof. Each bench ran once per build, and the share of questions that change between two runs of the same build was not measured.

## Which one is closer to the FP8 model?

NVIDIA's, by a little. Each arm scored the same 30 fixed texts of 1,024 tokens, and arm C, Qwen's own FP8 checkpoint, is the reference:

| Against FP8 | A: RadixArk | B: NVIDIA |
|---|---|---|
| Mean negative log-likelihood (FP8: 1.7774) | 1.7864 | 1.7822 |
| Mean divergence from FP8 (KL, top 20) | 0.0688 | 0.0638 |
| Same first choice as FP8 | 89.3% | 90.2% |

That is 7% less divergence for NVIDIA's build. It is the one measure where it leads, and it does not show in the answers: the three benches lean the other way.

## What does this not show?

- One pass of each bench per build. A second pass could move MMLU either way.
- No agent or tool-calling bench, and no vision.
- One box, one engine: SGLang with a draft model. Under another engine the two builds may differ in what they need (the KV declaration above is one such case).

## What does Alzeo do with it?

Nothing changes. The rule set before the run was: NVIDIA's build becomes the lane's default if it measures better. It did not, so the 27B lane keeps `RadixArk/Qwen3.8-27B-NVFP4`. If you already serve one of the two, there is no reason here to download the other. A new revision of either repository reopens the question.
