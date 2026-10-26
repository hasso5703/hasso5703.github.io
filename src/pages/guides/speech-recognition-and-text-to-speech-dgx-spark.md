---
layout: ../../layouts/Guide.astro
slug: speech-recognition-and-text-to-speech-dgx-spark
title: "Speech recognition and text to speech on a DGX Spark, on the CPU"
description: "Qwen3-ASR hears 30 languages and Kokoro speaks seven, on a DGX Spark's CPU beside any model, behind OpenAI-compatible audio routes."
h1: "Speech recognition and text to speech on a DGX Spark"
published: "2026-10-26"
installNote: "Install the stack with this command first, then run ./install-speech.sh from the clone, and again after each update."
answer: "Run <code>./install-speech.sh</code> after the install: Qwen3-ASR recognizes speech in 30 languages and Kokoro-82M speaks with 41 voices in seven languages, behind OpenAI-compatible audio routes. It runs on the CPU alone, so it sits beside whichever lane serves."
faq:
  - q: "Can a DGX Spark do speech to text locally?"
    a: "Yes. Qwen3-ASR recognizes speech in 30 languages on the box's CPU, behind an OpenAI-compatible audio route, and answers the official OpenAI SDK as it is."
  - q: "Does speech slow down the model that serves?"
    a: "No. It uses five small CPU cores for each engine and no GPU memory. With both speech engines busy, the flash lane's decode did not move (47.5 tok/s)."
  - q: "Which audio files does it read?"
    a: "Any audio ffmpeg reads, such as a phone's m4a or a browser's webm. Long recordings are cut into pieces of 30 s at their quiet moments."
  - q: "Is speech part of the one command?"
    a: "Not yet. It is opt-in: from a clone, after ./install.sh, run ./install-speech.sh. It takes about 3 minutes and is proved before it ends. The one command's updates leave it as it is, so run ./install-speech.sh again after each one."
sources:
  - label: "README.md, Speech"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md#speech-qwen3-asr-and-kokoro-on-the-cpu-beside-any-lane"
  - label: "docs/speech-lane.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/speech-lane.md"
related:
  - label: "An OpenAI-compatible API on a DGX Spark"
    href: "/guides/openai-compatible-api-dgx-spark/"
---

## How do I install speech on my Spark?

```bash
./install-speech.sh    # from a clone, after ./install.sh: about 3 minutes, proved before it ends
```

Speech is opt-in and not in the one command yet. It installs two engines behind OpenAI-compatible audio routes on `127.0.0.1:30024`, on the box.

## What does it recognize, and what does it say?

- **Qwen3-ASR** recognizes speech in 30 languages.
- **Kokoro-82M** speaks with 41 voices in seven languages.

Both answer the official OpenAI SDK as it is.

## Does it take memory from the models?

A little. It runs on the CPU alone, five small cores for each engine, and allocates no GPU memory. But on a GB10 the CPU and the GPU share one memory: running, the lane holds 2.5 GB at rest and 2.7 GB at work with the 0.6B recognizer (4.2 GB with the 1.7B), memory that a flash lane's long prompts also want. That is why it does not start at boot unless `SPEECH_BOOT=1`. With both speech engines busy, the flash lane's decode did not move (47.5 tok/s).

## Which recordings can I send?

Any audio ffmpeg reads, a phone's m4a or a browser's webm among them. Long recordings are cut into pieces of 30 s at their quiet moments.

## Where are the details?

The languages, every number and the limits are in [docs/speech-lane.md](https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/speech-lane.md).
