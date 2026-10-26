---
layout: ../../layouts/Guide.astro
slug: dgx-spark-freezes-when-loading-a-model
title: "DGX Spark freezes when loading a model: the unified-memory trap"
description: "SGLang misses 25-40 GB of transient allocations on a DGX Spark, and a pool pushed to zero freezes it. Why it happens, how to see it coming and how to avoid it."
h1: "Why does my DGX Spark freeze when a model loads?"
published: "2026-10-26"
answer: "On a GB10, SGLang's memory accounting does not see <strong>25-40 GB</strong> of transient allocations (the flashinfer fp8 autotuner and CUDA graph capture), so a memory fraction set too high can drive host available memory to zero and take SSH down with it until a power cycle. The installer pins the 27B at <strong>0.76</strong> in its default 1M mode, with the autotuner disabled (0.80 was measured crashing under 3 concurrent requests), which leaves <strong>21.30 GiB</strong> of GPU-side headroom after graph capture, and adds a start guard and a 3 GiB memory floor."
faq:
  - q: "Why does SSH stop answering on my DGX Spark while a model loads?"
    a: "The GPU and the system share one memory pool on a GB10. When an engine's untracked allocations take host available memory to zero, the SSH daemon has nothing left either, and only a power cycle brings the box back."
  - q: "Is --mem-fraction-static 0.80 safe on a DGX Spark?"
    a: "For one stream on a dedicated box, the SGLang cookbook's 0.80 is well evidenced: 48 configurations at concurrency 1. For several clients it is not: 0.80 was measured crashing on the 27B under 3 concurrent requests, with 2 GiB free."
  - q: "Does docker --memory stop a DGX Spark from running out of memory?"
    a: "No. It bounds host RSS, but the cgroup does not see CUDA unified allocations: at fraction 0.76 the container held 7.15 GiB of its 100 GiB while the engine generated. The memory fraction is the real guard."
  - q: "Are NVRM NV_ERR_NO_MEMORY lines in the kernel log a sign of a coming freeze?"
    a: "Not by themselves. The reference box logged 4,286 of them in three weeks, two thirds during ordinary engine boots, and the engine's own allocations still succeed. Host MemAvailable is the number to watch."
  - q: "What does the cockpit's memory floor do?"
    a: "When host MemAvailable drops under 3 GiB while requests are running, the cockpit aborts every generation in flight, never twice within 60 s and never when nothing runs. COCKPIT_MEM_FLOOR_GIB sets the threshold."
  - q: "Why does my engine wait instead of starting after a crash?"
    a: "The start guard holds it while what is left of an engine holds more than 2 GiB of GPU memory, or the driver keeps more than 16 GiB that no process accounts for. systemd tries again every 15 s, and the lane starts by itself once the memory is back."
sources:
  - label: "README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md"
  - label: "docs/gb10-memory.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/gb10-memory.md"
  - label: "docs/engine-restarts.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/engine-restarts.md"
  - label: "docs/cockpit.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/cockpit.md"
  - label: "docs/flash-local-lane.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/flash-local-lane.md"
  - label: "docs/flash-lane.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/flash-lane.md"
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/BENCHMARKS.md"
  - label: "dashboard/cockpit.py"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/dashboard/cockpit.py"
  - label: "dashboard/lifecycle.py"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/dashboard/lifecycle.py"
related:
  - label: "What to run on a 64 GB DGX Spark"
    href: "/dgx-spark-64gb/"
  - label: "Every GB10 machine"
    href: "/machines/"
  - label: "All guides"
    href: "/guides/"
---

## What is the GB10 unified-memory trap?

A GB10 has no separate video memory. What a GPU allocation takes is the machine's own memory, the same 128 GB pool the operating system and SSH run in. SGLang sizes its static pool with `--mem-fraction-static`, but on GB10 its memory accounting does not see 25-40 GB of transient allocations: the flashinfer fp8 autotuner and CUDA graph capture allocate outside the tracked pool.

Set the fraction too high, or run SGLang natively outside Docker, and host available memory can reach zero. On a machine where SSH rides on that same memory, the box stops answering, and only a power cycle brings it back.

Loading is where the project has caught it: CUDA graph capture is a boot stage, a vLLM lane's allocator cache took the box to the memory edge while it prepared its weights, and an engine can start on top of memory a dead one still holds. Each case is below, with what the installer does about it.

## Does docker --memory stop a DGX Spark from running out of memory?

No. On a 128 GB box the 27B units cap the engine's container with `--memory 100g --memory-swap 100g`, so a runaway kills the container, never the host. But the cgroup does not see CUDA unified allocations. Measured at fraction 0.76 under a 5,623-token generation, the container held 7.15 GiB of its 100 GiB throughout. `docker stats` and the process RSS look calm while the pool runs out. The fraction is the real guard.

## What --mem-fraction-static is safe on a DGX Spark?

For the 27B on SGLang, the installed units pin it for you:

- **0.76** in 1m mode, the default since v1.12.1, with the autotuner disabled
- **0.50** in native mode and under `./run.sh`
- **0.80 was measured crashing** under 3 concurrent requests (2 GiB free, Triton `CUDA operation not permitted`). On the 27B, treat anything past 0.80 as livelock territory.

The pin moved from 0.70 to 0.76 because the image changed: on the official release image, 0.70 cost 15% of the KV pool (770,118 tokens against 906,524) and left 10 GB of GPU memory unclaimed. At 0.76 the GPU-side headroom after graph capture is 21.30 GiB, against 19.38 GiB for the old pin, 0.70 on the previous image. That headroom is the number to watch.

The SGLang cookbook's 0.80 for the 27B on DGX Spark is not a contradiction. Its GB10 cells ran 48 configurations at ISL 8192 / OSL 1024 and concurrency 1, boot-and-serve only. It rejects 0.85 because 0.85 of 128 GB leaves about 8 GB for the OS, exactly DGX OS earlyoom's SIGTERM threshold, and 15 of 48 cells were killed there. For one stream on a dedicated box, the cookbook's 0.80 is the better-evidenced pin. The installer optimizes for several clients at once.

Other lanes carry their own measured values: the flash lane runs 0.85 under a 110g cap, the value of the SGLang cookbook's single-Spark Flash-Next cells, and the vLLM lanes set `--gpu-memory-utilization` (Kolibri 0.80 or 0.55, Bolt 0.70, Super VL 0.75, Flash FP4-Local 0.80).

## Why does a DGX Spark freeze after an engine crash or restart?

An engine that loads needs the last one's memory back first. In a crash test of the 27B lane on 2026-10-01, the 92 GB the engine held came back within 2 to 5 s. In sglang#40948 it did not: the driver kept a dead engine's memory, the next start piled its allocations on top, and a DGX Spark froze for 9.5 h.

Every engine unit runs a start guard, `engine-preflight.sh`, before its engine. It waits up to 60 s and refuses the start while:

- what is left of an engine holds more than 2 GiB of GPU memory
- the driver keeps more than 16 GiB that no process accounts for (measured: 1.1 GiB with no engine)
- `nvidia-smi` does not answer within 10 s

systemd tries again 15 s later, so the lane starts by itself once the memory is back, and the cockpit shows **waiting for GPU memory** with the reason. If nothing holds the memory and the driver still keeps it, only a reboot frees it.

## How do I see a DGX Spark freeze coming?

Watch host `MemAvailable` in `/proc/meminfo`, not RSS. The cockpit, installed by default, reads it and carries a memory floor: when `MemAvailable` drops under 3 GiB while requests are running, it aborts every generation in flight, never twice within 60 s and never when nothing runs (`COCKPIT_MEM_FLOOR_GIB` sets the threshold).

Long prompts can push it too. On the flash lane as release v1.5 served it (2026-08-29), a 177K-token prompt took `MemAvailable` down to 0.8 GiB while the process RSS stayed at 5.7 GiB. That is why the proxy caps one prompt on that lane. The engine has trimmed that growth since v1.8, and v1.10.2 measured 1.52 GiB of host headroom spent on a 249,500-token prompt.

Two things look alarming and are not:

- `NVRM: ... NV_ERR_NO_MEMORY` lines in the kernel log are routine on GB10: 4,286 on the reference box in three weeks, two thirds during ordinary engine boots. The cockpit counts them as "GPU driver refused N allocations at the edge of memory" and takes no action.
- While an engine serves, a new CUDA context (another GPU program starting) can fail with `CUDA_ERROR_OUT_OF_MEMORY` while `MemAvailable` reads 15 to 19 GiB. The truly free memory is then about 1 GiB with no free block of 2 MiB or more, and the engine's own allocations still succeed.

An engine that earlyoom killed shows in `journalctl -u earlyoom` (exit -15, no traceback).

## Can a model's boot dip memory even at a safe setting?

Yes, and the Flash FP4-Local lane showed it. In each of its twelve boots on 2026-10-19 and 20, `MemAvailable` fell to between 0.5 and 3.5 GiB, and at the last one it went from 37 to 1.05 GiB in 8 seconds. PyTorch's allocator cache grew while the weights were prepared, and on a GB10 that cache is the machine's memory. The unit now sets the allocator a memory ceiling and a garbage-collection threshold. With it, two boots bottomed out at 19.1 and 18.7 GiB, and in four later boots, read every 0.2 or 0.5 s, it stayed at 11.7 GiB or more: the setting ends the dip.

## What about a 64 GB DGX Spark?

On a 64 GB DGX Spark, the installer reads the box's class from its MemTotal and installs only what fits it. A lane that needs a 128 GB box is refused before a byte is fetched, in the installer, in `switch-model.sh` and in the cockpit's Load.
