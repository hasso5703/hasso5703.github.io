---
layout: ../../layouts/Guide.astro
slug: update-dgx-spark-ai-stack
title: "Update the AI stack of a DGX Spark without breaking it"
description: "One command installs and updates the AI stack of a DGX Spark: pinned images and checkpoints, your choices kept, the serving model proved."
h1: "Update the AI stack of a DGX Spark without breaking it"
published: "2026-10-26"
answer: "Run the same command that installed it. It updates the repo, then runs the pinned installer: engine images are pinned by digest and checkpoints by revision, your choices are remembered, and the lane that serves proves it serves before the update ends."
faq:
  - q: "How do I update the AI models and engines on my DGX Spark?"
    a: "Run the install command again. It updates the repo in ~/dgx-spark-qwen38 and runs the pinned installer, which updates every lane already on the box."
  - q: "Will an update change my settings?"
    a: "Not the ones you chose. Re-running the installer remembers the installed model, the context mode, the port, the Hugging Face cache, and the opencode and cockpit choices. A value that only an older release's default put on the box, and that nothing records as your choice, moves to today's default, and every run lists what moves and what stays before its first step."
  - q: "How do I know a newer release exists?"
    a: "The cockpit's Settings view shows whether a newer release is out and gives the command that updates the stack."
  - q: "Does an update download every model?"
    a: "No. A lane the box never had gets its units, and its first Load from the cockpit prepares it. A lane already on the box is updated whole."
sources:
  - label: "README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md"
  - label: "Releases"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/releases"
related:
  - label: "Why a DGX Spark freezes when it loads a model"
    href: "/guides/dgx-spark-freezes-when-loading-a-model/"
  - label: "All guides"
    href: "/guides/"
---

## What does the update command do?

One command does the first install and every update. It clones or updates `~/dgx-spark-qwen38`, then runs the pinned installer: the lane that serves (the 27B, or Bolt on a 64 GB box), the keepalive proxy, the opencode wiring, the cockpit and its Agent view, and every other lane on demand.

## Why is a pinned update predictable?

Engine images are pinned by digest and checkpoints by revision, so an update installs exactly what the release pins. The lane that serves proves it serves before the install ends.

## Are my choices kept?

Yes. Re-running the installer remembers the installed model, the context mode, the port, the Hugging Face cache, and the opencode and cockpit on and off choices, and every run says which.

## What about the lanes I never used?

Updating a box adds the lanes it does not have yet, on demand: a lane the box never had gets its units, and its first Load from the cockpit prepares it, as you, with no sudo. A lane already on the box is updated whole.

## How do I know an update is out?

The cockpit's Settings view shows whether a newer release is out and gives you the command that updates the stack. Every release has its notes on [GitHub](https://github.com/hasso5703/dgx-spark-qwen38/releases).
