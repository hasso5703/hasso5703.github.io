---
layout: ../../layouts/Guide.astro
slug: openai-compatible-api-dgx-spark
title: "An OpenAI-compatible API on a DGX Spark: Open WebUI, Cursor, SDKs"
description: "Point Open WebUI, Cursor, Continue, Zed or the OpenAI SDK at your DGX Spark: one base URL on port 30001 and an API key. Any model name works."
h1: "An OpenAI-compatible API on a DGX Spark"
published: "2026-10-26"
answer: "Anything that takes a <code>base_url</code> and an API key points at <code>http://&lt;your-spark&gt;:30001/v1</code>, with the box's API key as the token. It may send any model name: the lane that serves answers it."
faq:
  - q: "What base URL do I give Open WebUI for a DGX Spark?"
    a: "OPENAI_API_BASE_URL=http://&lt;your-spark&gt;:30001/v1, with the box's API key. Model discovery through GET /v1/models answers through the proxy."
  - q: "Which model name should my client send?"
    a: "Any. The lane that serves answers it, for example qwen3.8-27b on the 27B."
  - q: "Does the box speak the Anthropic API too?"
    a: "Yes. The same port serves the Anthropic route, /v1/messages, which Claude Code uses."
  - q: "Do I need an API key?"
    a: "Yes. The proxy checks the key before it reads a request's body, and a request without it gets a 401. The health and metrics routes stay open."
  - q: "Can I reach the engine directly on port 30000?"
    a: "Only on the box itself: since v1.17 the engine binds 127.0.0.1. Clients connect to the proxy on 30001, which adds keepalives and refuses what would take the engine down."
sources:
  - label: "docs/clients.md, Standard OpenAI-compatible clients"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/clients.md"
related:
  - label: "Claude Code with a local model on a DGX Spark"
    href: "/guides/claude-code-local-model-dgx-spark/"
  - label: "opencode with a local model on a DGX Spark"
    href: "/guides/opencode-local-model-dgx-spark/"
---

## What is the base URL and the key?

```bash
base_url = http://<your-spark>:30001/v1
api_key  = the API key the installer created on the box
```

Port 30001 is the keepalive proxy in front of the engine. It speaks the OpenAI routes (`/v1/chat/completions`, `/v1/completions`, `/v1/models`) and the Anthropic route (`/v1/messages`).

## How do I connect Open WebUI?

Set `OPENAI_API_BASE_URL=http://<your-spark>:30001/v1` and the key as above. Model discovery through `GET /v1/models` answers through the proxy, so the lane that serves shows up as a model.

## How do I connect Cursor, Continue or Zed?

Use their OpenAI provider with the same base URL and key. For requests with images, the proxy counts each image's tokens from the image's own header and the vision tower's geometry.

## And the OpenAI SDK?

```python
from openai import OpenAI

client = OpenAI(base_url="http://<your-spark>:30001/v1", api_key="<key>")
reply = client.chat.completions.create(
    model="qwen3.8-27b",
    messages=[{"role": "user", "content": "Hello from my Spark"}],
)
print(reply.choices[0].message.content)
```

Any model name works: the lane that serves answers it.

## Why the proxy and not the engine?

The proxy sends the keepalives that stop client watchdogs from killing long prefills, aborts decodes when a client disappears, and refuses the requests that would take the engine down before they reach it, with an answer a client can act on. The engine port speaks the same APIs without that protection, and since v1.17 it answers on the box only.

## Which clients are measured, and which are configured?

Claude Code and opencode are measured on the reference box. Open WebUI, Cursor, Continue and Zed are configured with their vendors' standard OpenAI fields and not measured here. If one of them disagrees with this page, a box-report issue with the client's exact request body is the contribution that moves it.
