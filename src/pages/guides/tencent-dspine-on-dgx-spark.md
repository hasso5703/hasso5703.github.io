---
layout: ../../layouts/Guide.astro
slug: tencent-dspine-on-dgx-spark
title: "Tencent DSpine on a DGX Spark: measured against DFlash2"
description: "Tencent's DSpine drafter on a DGX Spark (GB10): 60.4 tok/s against 67.3 for DFlash2 on the same box, and sampled answers carry stray tokens. Greedy only."
h1: "Is Tencent's DSpine worth running on a DGX Spark?"
published: "2026-11-10"
answer: "Not today. On a DGX Spark (GB10, 128 GB), Tencent's DSpine drafter for Qwen3.8-27B measured <strong>60.4 tok/s</strong> on short greedy prompts, against <strong>67.3</strong> for the DFlash2 drafter Alzeo serves on the same box (the middle of three runs each). With sampling on, 23 of 24 answers carried stray <code>!</code> characters where real tokens belonged, so on this hardware it is greedy only. Measured on 2026-11-09 on one reference box."
faq:
  - q: "Does DSpine run on a DGX Spark?"
    a: "Yes, with changes. On the reference box it started with its draft attention on Triton and three small patches to the plugin, on SGLang 0.5.22. An open pull request on Tencent/DSpine goes the same way."
  - q: "Is DSpine faster than DFlash2 on a DGX Spark?"
    a: "No. Three runs of the same short-prompt bench gave 57.5, 60.6 and 60.4 tok/s for DSpine, against 68.8, 66.8 and 67.3 for Qwen3.8-27B with its NVFP4 DFlash2 drafter. DSpine held on code and lost on prose and JSON."
  - q: "Can I use a temperature with DSpine on a GB10?"
    a: "Not safely. Speed and acceptance length looked healthy, but 23 of 24 sampled answers carried stray ! characters, about 100 in 9,600 tokens, each where one or a few real tokens belonged. The 8 greedy answers carried none, and neither did 32 answers of the DFlash2 lane on the same prompts."
  - q: "Why does DSpine need another checkpoint?"
    a: "It refuses a quantized LM head, so the target was RadixArk/Qwen3.8-27B-NVFP4-BF16-LMHead. At the same memory fraction that checkpoint left a KV pool of 678,798 tokens, against 907,852 for the build with an FP4 head."
  - q: "Would a throughput benchmark have caught the stray tokens?"
    a: "No. Tokens per second and acceptance length were normal, and the text continued as if the right token were there. Only reading the generated answers showed it."
  - q: "Does Alzeo install DSpine?"
    a: "No. Alzeo serves Qwen3.8-27B with a DFlash2 drafter, which measured faster on this hardware and returned clean sampled answers on the same prompts."
sources:
  - label: "NVIDIA developer forum, the measurements as posted"
    href: "https://forums.developer.nvidia.com/t/380257/122"
  - label: "Tencent/DSpine, pull request 4, the same findings"
    href: "https://github.com/Tencent/DSpine/pull/4#issuecomment-6755399923"
related:
  - label: "All guides"
    href: "/guides/"
  - label: "Which inference engine should you run on a DGX Spark?"
    href: "/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/"
  - label: "Is TensorFold faster than vLLM on a DGX Spark?"
    href: "/guides/tensorfold-vs-vllm-on-dgx-spark/"
---

## How was DSpine run on a GB10?

DSpine is Tencent's drafter for speculative decoding of Qwen3.8-27B: a small model proposes tokens and the 27B verifies them. It was run on 2026-11-09 on the reference box, an ASUS Ascent GX10 (GB10, 128 GB), next to the lane Alzeo serves every day.

| | DSpine arm | DFlash2 arm (what Alzeo serves) |
|---|---|---|
| Engine | SGLang 0.5.22 | SGLang 0.5.22 |
| Target | RadixArk/Qwen3.8-27B-NVFP4-BF16-LMHead | RadixArk/Qwen3.8-27B-NVFP4, FP4 head |
| Drafter | tencent/Qwen3.8-27B-DSpine-b16, draft attention on Triton | NVFP4 DFlash2, 16 draft tokens |
| Memory fraction | 0.76 | 0.76 |
| KV pool | 678,798 tokens | 907,852 tokens |

The plugin was Tencent/DSpine at commit `321b0fc`, with three patches: Triton allowed for the draft attention, the FlashAttention backend check kept for `fa3` and `fa4` only, and neither the ragged graph nor the device-only check of `verification/sps.py` when `batch8_tokens` is 128. Without the last one, a FlashInfer target stops at start on "FlashInfer does not support ragged verify in cuda graph". An open pull request on the project takes the same route with Triton on both sides.

## How fast is DSpine against DFlash2?

Slower on this box. The bench is Alzeo's `./bench.sh`: short prompts, greedy, one request at a time, three runs for each arm.

| `./bench.sh`, greedy median (tok/s) | Three runs | Middle run |
|---|---|---|
| DSpine b16 | 57.5, 60.6, 60.4 | 60.4 |
| DFlash2 | 68.8, 66.8, 67.3 | 67.3 |

A second probe sent four prompts (code, math, prose, JSON) of 400 tokens with thinking on, two passes each. Median tok/s, with the mean acceptance length in brackets. The DFlash2 lane was measured on two boots, and both are shown because they differ:

| Setting | DSpine b16 | DFlash2, two boots |
|---|---|---|
| Greedy | 37.0 (3.82) | 41.3 (3.85) and 46.7 (3.96) |
| T=1.0, top_k 20, top_p 0.95 | 31.9 (3.58) | 34.7 (3.70) and 42.2 (3.92) |
| T=0.6, top_k 20, top_p 0.95 | 33.5 (3.72) | 41.2 (3.66) and 42.9 (3.84) |
| No sampling settings sent | 29.9 (3.51) | 34.6 (3.55) and 41.3 (3.86) |

By prompt, greedy: DSpine gave 51.0 tok/s on code, where the DFlash2 lane gave 47.2 and 60.4 over its two boots. On prose it gave 17.7 against 23.1 and 22.3, and on JSON 27.4 against 35.1 and 34.0.

## What goes wrong with sampling?

An owner reported on the NVIDIA forum that sampled requests collapse on a Spark when the draft attention runs on `fa4`: an acceptance length of 1 and `!!!!` as the answer. With the draft attention on Triton that collapse is gone. Speed and acceptance length look healthy, as the table above shows.

The answers are still not clean. Read one by one, 23 of the 24 sampled answers carry stray `!` characters: 37 in the 8 answers at T=1.0, 29 at T=0.6 and 33 with no sampling settings sent. That is 99 in about 9,600 sampled tokens. The 8 greedy answers carry none, and neither do the 32 answers of the DFlash2 lane on the same prompts and settings.

Each one stands where one or a few real tokens belong, and the text goes on as if they were there:

```
for start, end in sorted_intervals[1!]:
"The Cartographer's Debt!": "Elena Vasquez"
```

The first line should read `[1:]`. In the second, a comma and the `"author"` key are missing. `!` is token id 0 in the Qwen3.8 tokenizer, so this looks like an output slot left at zero and not like a token the model sampled. The cause was not found. DSpine's fast path for sampled requests is written for an H100 (`sampling/target.py` returns early unless it finds 132 SMs at `sm_90`), so a GB10 takes the generic path.

The result is code that does not run and JSON that does not parse, under a benchmark that says everything is fine. Tokens per second and acceptance length cannot see this kind of fault. Save the generations and read them, or compare them with a reference run.

## What else does it cost?

- **KV pool.** DSpine refuses a quantized LM head. The BF16-head checkpoint it needs left 678,798 tokens of KV pool at the same memory fraction, against 907,852.
- **Heat.** At 46 to 49 W on the GPU, one request at a time, the median of the hottest SoC zone was 91.4 °C under DSpine against 84.4 °C under DFlash2 on the bench, 91.9 against 85.8 on the sampling probe, and 92.8 against 90.8 on a prefix-cache probe. The DFlash2 runs came 10 to 90 minutes earlier the same evening, so part of the gap may be heat already in the box.
- **Repeatability** was close: two cold greedy runs gave the same 48 tokens on 14 documents of 16, against 15 of 16 for DFlash2.

## What was not measured?

The run ended when the box powered off at 96.4 °C, after four hours of campaigns one after the other. Real coding agents through the proxy, 8 concurrent requests, long generations and prompts past the 262K window of the BF16-head checkpoint were not measured. Nothing here says how DSpine behaves on an H100, the hardware its fast path is written for.

## Should you run it?

On a DGX Spark today: greedy only, and it is slower than a DFlash2 drafter with an FP4 head. If you try it anyway, send temperature 0, read the answers and watch the ACPI thermal zones, which read higher than `nvidia-smi` on this machine (88 °C on the GPU when a SoC zone read 96.4 °C).
