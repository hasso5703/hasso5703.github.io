---
layout: ../../layouts/Guide.astro
slug: dgx-spark-1m-token-context
title: "DGX Spark 1M-token context: which models serve it, what it costs"
description: "A plain install serves Qwen3.8-27B with a 1,010,000-token window on a DGX Spark. The KV pool behind it, the other 1M lanes, prefill times and how to switch."
h1: "Can a DGX Spark run a 1M-token context?"
published: "2026-10-26"
answer: "Yes, on a 128 GB box. A plain install serves Qwen3.8-27B with a <strong>1,010,000-token window</strong> (YaRN, the default since v1.12.1), and the Nemotron 3.5 Super VL and Ornith 1.5 122B lanes serve <strong>1,048,576</strong> tokens. On the 27B the KV pool decided at boot is the real limit, <strong>832,993 to 922,094 tokens</strong> over sixteen boots, and the installer fits the client limits to the pool your boot got."
faq:
  - q: "Is the 1M context on by default on a DGX Spark?"
    a: "Yes, on a 128 GB box since v1.12.1: a plain install serves Qwen3.8-27B with a 1,010,000-token window. CONTEXT_MODE=native ./install.sh serves the 262,144 window instead."
  - q: "Can one prompt fill the whole 1,010,000-token window on the 27B?"
    a: "No. The KV pool decided at boot ranged from 832,993 to 922,094 tokens over sixteen boots, and the proxy refuses a prompt past 92% of it. The pool your boot got is the real limit, and the installer fits opencode's limits to it."
  - q: "Does a 64 GB DGX Spark run a 1M context?"
    a: "No. On a 64 GB box the installer refuses CONTEXT_MODE=1m, Nemotron 3.5 Super VL and Ornith 1.5 122B, as they need a 128 GB DGX Spark. Its 27B serves without the 1M window, with 59,625 tokens of KV, so one prompt of up to 54,855 tokens."
  - q: "Why does the flash lane stay at 262,144 tokens?"
    a: "A 1M window for it on one GB10 is bought with an fp8 KV cache, which two independent parties measured as a quality loss on agentic work. The flash lane keeps a bf16 KV cache and its 262,144 window."
  - q: "How long until the first token on a 1M-token prompt?"
    a: "Nemotron 3.5 Super VL gave its first token after about 19 and a half minutes at a million tokens, and after about 16 s when the same prompt came back from the prefix cache. On the 27B, a 690K-token request took 40 minutes of cold prefill."
  - q: "Do clients need the keepalive proxy at 1M?"
    a: "Yes. A cold prefill can keep the connection silent for tens of minutes, and the proxy (port 30001 by default) fills that silence with protocol-correct keepalives every 10 s. Agent clients must use it, not the engine port."
sources:
  - label: "README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md"
  - label: "docs/context-1m.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/context-1m.md"
  - label: "docs/opencode.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/opencode.md"
  - label: "docs/clients.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/clients.md"
  - label: "docs/nemotron-super-lane.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/nemotron-super-lane.md"
  - label: "docs/ornith-lane.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/ornith-lane.md"
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/BENCHMARKS.md"
related:
  - label: "What to run on a 64 GB DGX Spark"
    href: "/dgx-spark-64gb/"
  - label: "Every GB10 machine"
    href: "/machines/"
  - label: "All guides"
    href: "/guides/"
---

## Which models serve a 1M-token context on a DGX Spark?

Three lanes, on a 128 GB box:

| Lane | Window (tokens) | KV cache measured | How it is served |
|---|---|---|---|
| Qwen3.8-27B, stock or uncensored (the default lane) | 1,010,000 | 832,993 to 922,094 tokens over sixteen boots | SGLang, YaRN patched into the configs |
| Nemotron 3.5 Super VL, 120B with 12B active | 1,048,576 | 1,166,215 to 1,382,265 tokens over two boots | vLLM, the model's whole window, 4 requests at a time |
| Ornith 1.5 122B | 1,048,576 | 1,301,680 tokens, fixed | vLLM, YaRN at factor 4 over its native 262,144 |

The flash lane (Qwen3.8-Flash-Next 176B) stays at 262,144 tokens with a bf16 KV cache. A 1M window for it on one GB10 is bought with an fp8 KV cache, which two independent parties measured as a quality loss on agentic work. Bolt and Kolibri-1 serve 262,144 too. On a 64 GB DGX Spark the installer refuses `CONTEXT_MODE=1m` and both 1M lanes, as they need a 128 GB box.

## How does the 27B serve 1,010,000 tokens?

The window comes from YaRN static scaling, factor 4.0 over the checkpoint's original 262,144 positions. The installer's `patch-yarn.py` writes it into both cached `config.json` files, the target model's and its DFlash2 draft's (the draft crashes at load otherwise), and keeps the originals beside them as `config.json.pre-yarn`. The unit adds `--context-length 1010000`, `--mem-fraction-static 0.76` and `HF_HUB_OFFLINE=1`, so no Hub metadata check can quietly undo the patched configs.

The keepalive proxy becomes load-bearing. A cold 690K-token prefill can keep the wire silent for tens of minutes, so the proxy sends protocol-correct keepalives every 10 s at SSE event boundaries, closes the upstream when the client leaves, and reports an explicit error only after 3600 s of true silence. Agent clients must use the proxy port (30001 by default). The engine port is for curl and benchmarks.

## Why is the KV pool smaller than the 1M window?

The pool is what the 0.76 fraction leaves after the weights, a share the GB10 unified-memory trap keeps in check, and it changes from one boot to the next. Over sixteen 27B boots on the reference box it ranged from 832,993 to 922,094 tokens, under the 1,010,000 window. The proxy refuses a prompt past 92% of the pool, and prompt and answer together must fit in it, so with `CONTEXT_MODE=1m` the limit is the pool, not the window. The cockpit's Lanes view shows yours.

So the installer fits the clients to your boot. opencode's generated config starts from 700,000 tokens of context and 200,000 of output. Its worst case, compaction at 680,000 plus one 43,863-token agent step and 200,000 of output, is 923,863 tokens, above every pool measured. At the end of every 1m install, once the engine is up, `oc-fit-limits.py` reads the pool your boot got and rewrites the limits to fit it, up or down. Since v1.18.2 the cockpit does the same fit after a switch and a Start, and its button re-fits after a reboot. Claude Code gets the same fit through `claude-local`, installed beside `oc`: its context budget is opencode's context plus 23,000, and its answer budget is opencode's.

Several agents at once share one pool. Past it, every turn computes its whole prompt again, so keep the sum of their contexts under the pool.

The FP8 targets hold less: 771,139 tokens against 863,398 for NVFP4 on the same 1m unit, and their memory ceiling at 1M is not measured. Run them at the native window, or watch host `MemAvailable`.

Ornith avoids the boot lottery by fixing its KV cache at 17 GiB, which holds 1,301,680 tokens. Left to a memory share of 0.8, it gave 829,030 to 1,149,938 tokens from one boot to the next, less than the window at some.

## How long does a 1M-token prompt take to answer?

Cold prefill is the cost of a long context:

- **27B:** a real 690K-token request took 40 minutes of cold prefill, then was cached. On 2026-09-21, on a 651,583-token prompt, the prefill rate fell from 320 tok/s at its start to 184 by its end as the context grew.
- **Super VL:** the first token came after 19 min 22 s to 19 min 28 s at a million tokens, and after 15.3 to 16.3 s when the same prompt came back from the prefix cache. A code hidden in prompts of 32,000 to 1,000,000 tokens was found 12 times in 12.
- **Ornith:** a code hidden at 499,974 tokens was found, its prompt prefilled in 19 min 27 s. One at 900,055 tokens, drafting off, took 55 minutes at about 270 tokens a second.

A prompt that comes back is served from the prefix cache, which is what keeps an agent's later turns fast.

## Does quality hold past 262,144 tokens?

On the 27B it is not formally evaluated, and the project treats the 1M mode as an experimental preset. Operationally it holds: one continuous opencode session reached 535,361 tokens, twice the native window, with zero compaction, about 360K tokens generated, 239 agent steps and 274 tool calls, and no retry.

Ornith measured the cost. YaRN at factor 4 costs short texts 0.4% of perplexity (0.66% in German), and GSM8K and HumanEval scored 98.8% and 93.9% against 97.6% and 95.1% at its native window, within the engine's run-to-run noise.

## How do I turn the 1M context on or off?

```bash
# a fresh install serves the 27B at 1,010,000 tokens
curl -fsSL https://raw.githubusercontent.com/hasso5703/dgx-spark-qwen38/main/get.sh | bash
# the 262,144 window instead
curl -fsSL https://raw.githubusercontent.com/hasso5703/dgx-spark-qwen38/main/get.sh | CONTEXT_MODE=native bash
# on an installed box, from the clone
CONTEXT_MODE=native ./install.sh
CONTEXT_MODE=1m ./install.sh
```

A re-run keeps the mode already installed, in both directions. Going native keeps the proxy and restores the `config.json.pre-yarn` originals over the patched target and draft configs. Since v1.36.0, a native window that only an install before v1.12.1 put on the box, and that nothing records as chosen, moves to 1m at the next update, which says so before its first step.

The two 1,048,576-token lanes need no context mode: press **Load** on the cockpit's Lanes view, or run `./prepare-lane.sh nemotron-super` the first time, then `./switch-model.sh nemotron-super` and the commands it prints (`ornith-122b` the same way). `./switch-model.sh stock` goes back to the 27B. Super VL needs 77 GB of disk beside the Nemotron lane (102 without it), and Ornith 78 GB beside the Flash FP4-Local lane (96 without it).
