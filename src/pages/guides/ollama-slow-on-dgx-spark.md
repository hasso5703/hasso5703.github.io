---
layout: ../../layouts/Guide.astro
slug: ollama-slow-on-dgx-spark
title: "Ollama slow on DGX Spark? What owners report, what is measured"
description: "Owners report Ollama slow on DGX Spark. What they found, what to check, and one same-harness test: 60.7 tok/s on vLLM against 42.1 on Ollama for GPT-OSS-120B."
h1: "Why is Ollama slow on my DGX Spark?"
published: "2026-10-26"
answer: "This project never measured Ollama. Owners who found it slow on a Spark point at three things: a model running on the CPU instead of the GPU, Ollama's Docker image, and dense models, whose every weight is read at each token. In one owner's same-harness test, vLLM led Ollama alone on three of four models (<strong>60.7 against 42.1 tok/s</strong> on GPT-OSS-120B) and on all four at 8 concurrent requests, where Ollama's total stayed at its single-stream figure."
faq:
  - q: "Has dgx-spark-qwen38 benchmarked Ollama?"
    a: "No. Its measurements cover SGLang, vLLM and llama.cpp on one reference box. What this page says about Ollama comes from owners' public reports and from Ollama's own published numbers, each linked."
  - q: "Why does Ollama show 0% GPU on my DGX Spark?"
    a: "One owner who set up Ollama with Open WebUI saw 0% GPU and 100% CPU, and the thread does not record the cause. Another found with ollama ps that a model had loaded 66% on the CPU and 34% on the GPU, and unloading and reloading it took the speed from 16 back to 40 tok/s."
  - q: "Is Ollama's Docker image slower on a DGX Spark?"
    a: "Owners in NVIDIA forum thread 353456 report it, and one says performance became normal after reinstalling Ollama natively. This project has not measured it."
  - q: "How much faster is vLLM than Ollama on a DGX Spark?"
    a: "It depends on the model and the load. In one owner's same-harness test, vLLM was faster alone on three of four models (60.7 against 42.1 tok/s on GPT-OSS-120B), Ollama on the fourth (85.2 against 77.1 on Qwen3-30B-A3B), and at 8 concurrent requests vLLM reached 289-313 tok/s on three of them."
  - q: "Why is qwen3:32b slow on a DGX Spark?"
    a: "It is dense: all 32B parameters are active, and each decode step reads all the weights through memory that measures about 225 GB/s. Ollama's own table lists it at 9.411 tok/s at q4_K_M, against 58.27 for gpt-oss 20B in MXFP4, a mixture of experts."
  - q: "Will these numbers match my Spark?"
    a: "Not exactly. Each is a point-in-time measurement on one machine, and speed varies with the model, the content and the language, so time the same prompt on your own box before deciding."
sources:
  - label: "NVIDIA forum: Very poor performance with Ollama on DGX Spark"
    href: "https://forums.developer.nvidia.com/t/very-poor-performance-with-ollama-on-dgx-spark-looking-for-help/353456"
  - label: "NVIDIA forum: Models not using Spark GPU?"
    href: "https://forums.developer.nvidia.com/t/models-not-using-spark-gpu/354600"
  - label: "NVIDIA forum: DGX Spark performance"
    href: "https://forums.developer.nvidia.com/t/dgx-spark-performance/356716"
  - label: "NVIDIA forum: same harness across Ollama, llama.cpp and vLLM"
    href: "https://forums.developer.nvidia.com/t/measured-inference-benchmarks-on-a-single-dgx-spark-same-harness-across-ollama-llama-cpp-and-vllm-notes-data-published/379766"
  - label: "ai-muninn: vLLM vs Ollama on the same model"
    href: "https://ai-muninn.com/en/blog/dgx-spark-vllm-vs-ollama-same-model"
  - label: "Ollama blog: NVIDIA DGX Spark performance"
    href: "https://ollama.com/blog/nvidia-spark-performance"
  - label: "Ollama blog: NVIDIA DGX Spark"
    href: "https://ollama.com/blog/nvidia-spark"
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/BENCHMARKS.md"
  - label: "extras/gguf/README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/extras/gguf/README.md"
  - label: "README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md"
related:
  - label: "All guides"
    href: "/guides/"
  - label: "Every GB10 machine runs it"
    href: "/machines/"
  - label: "What to run on a 64 GB DGX Spark"
    href: "/dgx-spark-64gb/"
---

## Has this project measured Ollama?

No. Its benchmarks cover SGLang, vLLM and llama.cpp on one reference box, an ASUS Ascent GX10, and none of them is Ollama. What this page says about Ollama comes from owners' public reports and from Ollama's own published numbers, each linked, and no comparison here goes beyond what its source measured. Ollama is a good tool with a real place on a Spark, and it [partnered with NVIDIA](https://ollama.com/blog/nvidia-spark) for the launch.

## What do owners report about Ollama on a DGX Spark?

- **The Docker image.** In [Very poor performance with Ollama on DGX Spark](https://forums.developer.nvidia.com/t/very-poor-performance-with-ollama-on-dgx-spark-looking-for-help/353456), the poster ran a 20B GPT OSS model in Docker and called the performance terrible, with GPU use around 89%. A second owner saw the same with gpt-oss-20b and 120b and found LM Studio much faster. The accepted reply says the Ollama image is slow, and a later owner reports normal performance after reinstalling Ollama natively instead of in Docker.
- **A GPU at 0%.** In [Models not using Spark GPU?](https://forums.developer.nvidia.com/t/models-not-using-spark-gpu/354600), an owner who set up Ollama and Open WebUI from NVIDIA's playbook saw 0% GPU in nvidia-smi and the DGX Dashboard, 100% CPU in btop, and every model extremely slow. The replies recommended llama.cpp or vLLM, and the thread does not record a cause.
- **A silent CPU split.** In [vLLM vs Ollama on the same model](https://ai-muninn.com/en/blog/dgx-spark-vllm-vs-ollama-same-model), the author measured Gemma 4 26B-A4B at 52 tok/s on vLLM with NVFP4 and 40 tok/s on Ollama with Q4_K_M. One Ollama run came back at 16 tok/s: `ollama ps` showed the model 66% on the CPU and 34% on the GPU, and unloading and reloading it brought it back to 40.
- **A dense model.** In [DGX Spark performance](https://forums.developer.nvidia.com/t/dgx-spark-performance/356716), an owner got 9.46 tok/s from qwen3:32b in Ollama and compared it with a gpt-oss:20b run at 43.73. Replies pointed out that qwen3:32b is dense, all 32B parameters active, while gpt-oss:20b is a mixture of experts with only 3.6B active per token.

## Why do dense models run slowly on a GB10?

Single-stream decode on this chip is bound by memory bandwidth: the GB10 advertises 273 GB/s, about 225 GB/s is measurable, and each decode step of a dense model reads all its weights. [Ollama's own Spark table](https://ollama.com/blog/nvidia-spark-performance) shows the pattern: qwen3 32B at q4_K_M decodes at 9.411 tok/s, while the mixtures of experts gpt-oss 20B and 120B, in MXFP4, reach 58.27 and 41.14, measured with Ollama v0.12.6 on firmware 580.95.05 in October 2025.

One way past that limit on a dense model is speculative decoding: a drafter proposes several tokens and the model checks them in one step, so one read of the weights yields more than one token. That is how this project's dense Qwen3.8-27B lane reaches a 71.4 tok/s greedy median on its `./bench.sh` probes. Compare like with like, too: on the reference box free prose ran slower than code with every engine and drafter tried, about 2x slower with a block drafter.

## What should you check first?

1. **Where the model runs.** `ollama ps` shows it in its Processor column, and the ai-muninn write-up treats anything short of 100% GPU as a reason to unload and reload the model.
2. **How Ollama is installed.** Owners in thread 353456 report the Docker image slow, and one reports normal speed after a native install.
3. **What kind of model it is.** A dense 32B and a mixture of experts with 3.6B active parameters are different workloads on the same box.
4. **How many requests you send at once.** In thread 379766, Ollama's total at 8 concurrent requests stayed at about its single-stream figure, and the ai-muninn write-up says Ollama queues requests by default unless `OLLAMA_NUM_PARALLEL` is raised.

## How does Ollama compare with vLLM on the same Spark?

One owner ran four models through both on one DGX Spark with one harness: identical prompt, 400 max tokens, warm-up discarded ([thread 379766](https://forums.developer.nvidia.com/t/measured-inference-benchmarks-on-a-single-dgx-spark-same-harness-across-ollama-llama-cpp-and-vllm-notes-data-published/379766), August 2026). Ollama ran Q4 builds and vLLM 4-bit builds, so the formats differ:

| Model (tok/s) | Ollama alone | vLLM alone | Ollama, 8 at once | vLLM, 8 at once |
|---|---|---|---|---|
| qwen3-coder-next | 59.2 | 74.8 | 60.4 | 289.0 |
| Gemma-4-26B-A4B (MTP on vLLM) | 49.6 | 54.9 | 51.9 | 303.6 |
| GPT-OSS-120B | 42.1 | 60.7 | 42.5 | 116-153 |
| Qwen3-30B-A3B | 85.2 | 77.1 | 87.5 | 313.4 |

Ollama led alone on Qwen3-30B-A3B, and vLLM on the other three. At 8 concurrent requests vLLM led on all four. Without speculative decoding, NVIDIA's NVFP4 build of that Gemma ran at 30.3 tok/s on vLLM, below the community Q4_K_M in Ollama. The author's caveats: one machine, one operator, one prompt set, speed only, and concurrent figures that moved ±30% between runs.

## What did this project measure instead?

None of the figures above are this project's. It measured llama.cpp, which also runs GGUF files, against its SGLang lane on the same Qwen3.8-27B with its frozen battery (greedy):

| Workload (tok/s) | llama.cpp UD-Q4_K_XL + MTP n=3, tuned | SGLang + DFlash2 (v1.2) |
|---|---|---|
| Agentic coding (code, diffs, tool calls) | 25.6 | 32-40 |
| Reasoning (FR) | 27.5 | 41-44 |
| Free prose EN / FR / DE | 17.7 / 18.2 / 18.0 | 22 / 20 / 17 |

Its lanes on the reference box include Qwen3.8-27B on SGLang at a 71.4 tok/s greedy median and 135-148 tok/s in all at 8 streams, Nemotron 3.5 Bolt on vLLM at 140 tok/s rewriting code and 201.2 tok/s in all at 16 streams, and Kolibri-1 on vLLM at 48.0 tok/s with one stream and 202.0 with 16. Those are other models than the owners', so they show what each lane delivers, not what Ollama would do with the same models.

## Should you move off Ollama?

Not for everything. Ollama is simple to start with, and the ai-muninn author still picks it for quick interactive use. For agents, several users or long sessions, the owner tests above and this project's lanes point to vLLM and SGLang, which kept scaling with concurrent requests. This project's installer sets both up on a Spark in one command, with versions pinned. Every number here is a point-in-time measurement on one machine, and your tok/s will vary with the model, the content and the language.
