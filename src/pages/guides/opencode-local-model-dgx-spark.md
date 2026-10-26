---
layout: ../../layouts/Guide.astro
slug: opencode-local-model-dgx-spark
title: "opencode with a local model on a DGX Spark, configured for you"
description: "The installer sets up opencode for your DGX Spark's model: an oc launcher that lifts the hidden 32,000-token output cap, limits fitted to the pool."
h1: "opencode with a local model on a DGX Spark"
published: "2026-10-26"
answer: "Run <code>oc</code> on the box. The installer writes opencode's provider config pointed at the proxy, an <code>oc</code> launcher that lifts opencode's hidden 32,000-token output cap, limits fitted to the lane's memory pool, reasoning-effort variants, and a chat template patched for agentic clients."
faq:
  - q: "Does opencode work with a local model on a DGX Spark?"
    a: "Yes. It is the primary client of the project: the installer writes its provider config, and its default model follows the lane the box serves."
  - q: "Why does the config point at port 30001 and not the engine?"
    a: "Port 30001 is the keepalive proxy. It keeps long prefills alive for the client, aborts decodes when a client disappears and refuses what cannot be served with an answer the client can act on. The engine port answers on the box only."
  - q: "Which opencode version does it install?"
    a: "One pinned version, the same on every box."
  - q: "Can I skip opencode?"
    a: "Yes. ./install.sh --no-opencode leaves out the opencode integration: its config, the oc launcher and the default model that follows each switch. The choice sticks across updates, until --with-opencode or --recommended."
  - q: "Is there opencode in the browser?"
    a: "Yes. The cockpit's Agent view runs opencode web on the box, from a laptop or a phone."
sources:
  - label: "README.md, opencode integration"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md#opencode-integration"
  - label: "docs/opencode.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/opencode.md"
  - label: "docs/clients.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/clients.md"
related:
  - label: "Claude Code with a local model on a DGX Spark"
    href: "/guides/claude-code-local-model-dgx-spark/"
  - label: "All guides"
    href: "/guides/"
---

## What does the installer set up for opencode?

- A ready-to-use provider config, pointed at the keepalive proxy on port 30001.
- An `oc` launcher that lifts opencode's hidden 32,000-token output cap.
- Limits fitted to the pool the lane boots to, by the installer and again at each Load in the cockpit.
- Reasoning-effort variants.
- A chat template patched for agentic clients.

```bash
oc          # opencode on the lane the box serves
```

## Why the proxy port and not the engine?

Agent clients connect to the keepalive proxy, not the engine. It sends the keepalives that stop client watchdogs from killing long prefills, aborts decodes when clients disappear, and refuses what cannot be served with a body a client can act on. The engine port speaks the same APIs without that protection, and it answers on the box only.

## Does the model change with the lane?

Yes. The default model in opencode's config follows the lane the box serves.

## Which opencode does it install?

One pinned version, the same on every box.

## Can I use pi or oh-my-pi too?

Yes. The same generated config is the single source for pi and omp (oh-my-pi): `./pi-gen.py` derives their ready configs.

## Can I run it in the browser?

Yes. The cockpit's Agent view runs opencode web on the box, from a laptop or a phone.

## Can I leave opencode out?

`./install.sh --no-opencode` leaves out the opencode integration: its config, the `oc` launcher and the default model that follows each switch. The choice sticks across updates, until `--with-opencode` or `--recommended`.
