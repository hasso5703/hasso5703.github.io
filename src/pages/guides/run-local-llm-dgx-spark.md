---
layout: ../../layouts/Guide.astro
slug: run-local-llm-dgx-spark
title: "How to run a local LLM on a DGX Spark: four ways, measured"
description: "Ollama, NVIDIA's playbooks, an engine you tune or a one-command installer: how each runs an LLM on a DGX Spark, what it asks of you, and the speeds measured."
h1: "How to run a local LLM on a DGX Spark"
published: "2026-10-26"
rank: 1
answer: "Four ways, from the quickest to start to the fastest to run: Ollama, NVIDIA's playbooks, an engine you tune yourself, or an installer that pins and tunes it for you. The speed depends less on the engine than on the quantization, the drafter and the memory settings: without speculative decoding a dense 32B reads all its weights at every token (Ollama's own table: 9.411 tok/s for qwen3 32B), while this project measures Qwen3.8-27B at <strong>71.4 tok/s</strong> with NVFP4 and a DFlash2 drafter."
faq:
  - q: "What is the easiest way to run an LLM on a DGX Spark?"
    a: "Ollama: one install and a model by name, and NVIDIA's playbooks use it for Open WebUI and a coding agent. In one owner's same-harness test it was slower than vLLM alone on three models of four, and at 8 concurrent requests its total stayed at about its single-stream figure."
  - q: "Is a DGX Spark fast enough for local LLMs?"
    a: "It depends on the setup more than on the chip. A dense model at 4 bits without speculative decoding is bound by memory bandwidth (9.411 tok/s for qwen3 32B in Ollama's table). With NVFP4 and a drafter, this project measures Qwen3.8-27B at 71.4 tok/s (greedy median), and mixtures of experts go further: Nemotron 3.5 Bolt at 140 tok/s rewriting code."
  - q: "Which engine is fastest on a DGX Spark?"
    a: "None on every job. On the same Qwen3.8-27B, SGLang with a block drafter led on code, and plain MTP heads held up better on free prose. What you generate and the drafter matter more than the engine."
  - q: "Can a DGX Spark run several models at once?"
    a: "They share one pool of unified memory with the operating system. This installer serves one lane at a time and keeps the others on disk, a Load away, with speech beside any lane on the CPU. Two engines at once is possible on your own setup if their memory settings leave room, and the GB10 memory trap applies."
  - q: "Does NVIDIA have its own launcher?"
    a: "NVIDIA announced NVIDIA Sync Model Launcher on 2026-10-02 for the end of October: it downloads and launches Qwen3.8 27B on one DGX Spark or a cluster, makes it reachable from a laptop, and sets up OpenCode in the browser."
sources:
  - label: "Ollama blog: NVIDIA DGX Spark performance"
    href: "https://ollama.com/blog/nvidia-spark-performance"
  - label: "NVIDIA forum: same harness across Ollama, llama.cpp and vLLM"
    href: "https://forums.developer.nvidia.com/t/measured-inference-benchmarks-on-a-single-dgx-spark-same-harness-across-ollama-llama-cpp-and-vllm-notes-data-published/379766"
  - label: "NVIDIA's DGX Spark playbooks"
    href: "https://build.nvidia.com/spark"
  - label: "NVIDIA blog, 2026-10-02: DGX Spark 64GB and NVIDIA Sync"
    href: "https://blogs.nvidia.com/blog/local-ai-dgx-spark-64gb-sync/"
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/BENCHMARKS.md"
  - label: "README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md"
related:
  - label: "Which inference engine should you run on a DGX Spark?"
    href: "/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/"
  - label: "Why is Ollama slow on my DGX Spark?"
    href: "/guides/ollama-slow-on-dgx-spark/"
  - label: "Why does my DGX Spark freeze when a model loads?"
    href: "/guides/dgx-spark-freezes-when-loading-a-model/"
---

## Which ways are there?

| Way | What you get | What it asks of you |
|---|---|---|
| Ollama | The quickest start: one install, models by name | In one owner's test, slower than vLLM on three models of four, and flat under concurrent requests |
| NVIDIA's playbooks | Official step-by-step guides at build.nvidia.com/spark for Open WebUI, vLLM, SGLang, llama.cpp, LM Studio, NIM and a coding agent | One engine and one model per guide. Memory settings, drafters and updates are yours |
| An engine you tune | The best speed for one model, when the quantization, the drafter and the memory fraction are right | The GB10 memory trap, and the pins and updates to keep up |
| This installer | Nine measured lanes, pinned and proved, OpenAI and Anthropic APIs, a cockpit, in one command | One lane serves at a time, on NVIDIA DGX OS and a GB10 machine |

## What decides the speed?

Single-stream decode on a GB10 is bound by memory bandwidth: the chip advertises 273 GB/s, about 225 GB/s is measurable, and each decode step of a dense model reads all its weights. Two levers move the result: the bytes each step reads (the quantization) and the tokens each step accepts (speculative decoding, where a drafter proposes tokens and the model verifies them, so the output does not change).

That is why the same box gives such different numbers. [Ollama's own Spark table](https://ollama.com/blog/nvidia-spark-performance) lists the dense qwen3 32B at 9.411 tok/s at q4_K_M, against 58.27 for the mixture of experts gpt-oss 20B. With NVFP4 weights and a calibrated DFlash2 drafter, this project measures Qwen3.8-27B at a 71.4 tok/s greedy median on `./bench.sh`.

## How do the engines compare on the same model?

On the reference box, an ASUS Ascent GX10, the repo ran Qwen3.8-27B through three engines on the same day in August 2026: about 34 tok/s on SGLang with NVFP4 and the DSpark drafter, about 27 on tuned llama.cpp with MTP, and about 24.5 on vLLM 0.27's official NVFP4 recipe, on code and math with French prompts. On its frozen battery, tuned llama.cpp measured 25.6 tok/s on agentic coding against 32-40 for SGLang with the v1.2 DFlash2 drafter. [The engines guide](/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/) has every table.

Ollama was not part of the repo's runs. In [one owner's same-harness test](https://forums.developer.nvidia.com/t/measured-inference-benchmarks-on-a-single-dgx-spark-same-harness-across-ollama-llama-cpp-and-vllm-notes-data-published/379766), vLLM was faster alone on three models of four (60.7 against 42.1 tok/s on GPT-OSS-120B), Ollama on the fourth (85.2 against 77.1 on Qwen3-30B-A3B), and at 8 concurrent requests vLLM led on all four.

## What can go wrong with a setup of your own?

Memory. A GB10 has no separate video memory: what the GPU allocates comes from the same pool the operating system runs in. SGLang's accounting misses 25 to 40 GB of transient allocations there, and a pool pushed to zero freezes the box until a power cycle. [The freeze guide](/guides/dgx-spark-freezes-when-loading-a-model/) says which settings are safe and why.

## What does this installer do differently?

It installs nine lanes, each pinned (engine images by digest, checkpoints by revision) and measured on the reference box, and lets them take turns in the unified memory: load one from the cockpit, and it serves while the others wait on disk. Every lane answers through a keepalive proxy that speaks the OpenAI and Anthropic APIs, so Claude Code, opencode and the SDKs point at the box instead of a cloud.

| Lane | Measured |
|---|---|
| Qwen3.8-27B, NVFP4 with a DFlash2 drafter, on SGLang | 71.4 tok/s, greedy median, one request, with a 1M-token window |
| Nemotron 3.5 Bolt, with its drafter, on vLLM | 140 tok/s, rewriting code, one request, reasoning off |
| Qwen3.8-Flash-Next 176B, on SGLang | 47.9 tok/s on code, with FLASH_TIER=context |

[All nine lanes, with their methods](/models/).

## What about NVIDIA's own launcher?

NVIDIA [announced NVIDIA Sync Model Launcher](https://blogs.nvidia.com/blog/local-ai-dgx-spark-64gb-sync/) on 2026-10-02, for the end of October: it downloads and launches Qwen3.8 27B on one DGX Spark or a cluster, makes it reachable from a laptop, and sets up OpenCode in the browser. It had not shipped when this guide was written.

## Which one should you pick?

- **To try a model in five minutes:** Ollama.
- **To learn one engine step by step:** NVIDIA's playbook for it.
- **To get the most out of one model and maintain it yourself:** tune the engine, starting from [the engines guide](/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/) and [the freeze guide](/guides/dgx-spark-freezes-when-loading-a-model/).
- **To serve agents and apps every day on measured settings:** this installer.
