---
layout: ../../layouts/Guide.astro
slug: claude-code-local-model-dgx-spark
title: "Claude Code with a local model on a DGX Spark, set up for you"
description: "Run Claude Code on the model your DGX Spark serves: claude-local sets the endpoint, the key and the limits of the lane, and keeps the session off Anthropic."
h1: "Claude Code with a local model on a DGX Spark"
published: "2026-10-26"
answer: "Run <code>claude-local</code> on the box. The installer puts it in <code>~/.local/bin</code>: it starts Claude Code on the lane the box serves, through the proxy's Anthropic route, with the key, the model, the timeouts and the context budget that fit that lane. Nothing of the session goes to Anthropic or to another provider."
faq:
  - q: "Can Claude Code use a local model on a DGX Spark?"
    a: "Yes. The box serves an Anthropic-compatible route through its proxy on port 30001, and claude-local starts Claude Code against it with the limits of the lane that serves."
  - q: "Does Claude Code send my code to Anthropic when it runs on the box's model?"
    a: "No. The model's requests go to the box, and claude-local cuts Claude Code's other traffic: telemetry, error reports, updates, feature flags, the claude.ai connectors of a signed-in account and the official marketplace's registration."
  - q: "Why does Claude Code compact earlier with a local model?"
    a: "Because its context budget is fitted to the memory pool of the lane that serves, not to a cloud model's window. A prompt past what the pool can hold is refused by the proxy, and Claude Code compacts and carries on."
  - q: "Does Claude Code's WebSearch work with a local model?"
    a: "No. Claude Code's built-in WebSearch runs at Anthropic. An MCP server of your own does the searching instead, and your own MCP servers stay."
  - q: "Can I run Claude Code on my laptop against the Spark's model?"
    a: "Yes. Point ANTHROPIC_BASE_URL at the box's port 30001, put the API key in ANTHROPIC_AUTH_TOKEN, and set the context and answer budget shown on this page."
sources:
  - label: "docs/clients.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/clients.md"
  - label: "README.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md"
related:
  - label: "What to run on a 64 GB DGX Spark"
    href: "/dgx-spark-64gb/"
  - label: "All guides"
    href: "/guides/"
---

## How does claude-local work?

Claude Code works through the proxy's Anthropic route, `/v1/messages`. `claude-local` sets, for the one process it starts, the proxy, the key (read from its file at each launch, in the environment only), the model that serves, the timeouts, and the context and answer budget that fit that lane. Then it runs `claude` with your arguments. Your `~/.claude` is left alone.

The context, the answer budget, the model and the timeouts you set yourself are kept. The endpoint and the key are always the box's. It reaches the box directly, never through an HTTP proxy your shell names.

```bash
claude-local                 # Claude Code on the lane the box serves
claude-local --continue      # any argument goes to claude
```

## What context and answer budget does it give each lane?

The pair comes from the lane's opencode limits, which the installer and the cockpit fit to its memory pool, its window and the proxy's ceiling. Claude Code's context budget (`CLAUDE_CODE_MAX_CONTEXT_TOKENS`) is opencode's context plus 23,000, and its answer budget (`max_tokens`) is opencode's.

| Lane | Context budget | Answer budget |
|---|---|---|
| Flash FP4-Local | 228,000 | 32,000 |
| Qwen3.8-27B in its 1M mode | 578,000 | 185,000 |
| A lane opencode has no limits for | 205,000 | 32,000 |

On a 64 GB box the 27B's pool is smaller: opencode's fit gives it 37,000 and 12,000 there.

## Does anything go to Anthropic?

No. The model's requests, auto mode's classifier among them, go to the box, and `claude-local` cuts the rest, whatever your shell, your own settings or a project's say: Claude Code's nonessential traffic (telemetry, error reports, `/feedback`, updates, feature flags), the claude.ai connectors of a signed-in account, the official marketplace's registration, auto mode's wait for the server's checks, WebFetch's hostname check at api.anthropic.com, and the other providers Claude Code reads before the endpoint.

Claude Code's built-in WebSearch runs at Anthropic and does not work on a local model. An MCP server of your own does the searching instead.

## Does it ask before running commands?

Since v1.40.2 a `claude-local` session starts in Claude Code's normal permission mode, which asks before each command, unless you pass a mode of your own (`--permission-mode auto`, or `--dangerously-skip-permissions`).

## How do I set it up by hand, from another machine?

Point Claude Code at the box's port 30001 with the box's API key. The last two lines keep the session off Anthropic, with `"skipWebFetchPreflight": true` in your settings:

```bash
ANTHROPIC_BASE_URL=http://<host>:30001   ANTHROPIC_AUTH_TOKEN="<key>"
CLAUDE_CODE_MAX_CONTEXT_TOKENS=228000    # a 262,144 window
CLAUDE_CODE_EXTRA_BODY='{"max_tokens":32000}'
API_TIMEOUT_MS=3600000
CLAUDE_BYTE_STREAM_IDLE_TIMEOUT_MS=1800000
CLAUDE_STREAM_IDLE_TIMEOUT_MS=1800000
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1   ENABLE_CLAUDEAI_MCP_SERVERS=false
CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL=1   CLAUDE_CODE_AUTO_MODE_SERVER=0
```

## What changes with the 1M-token window?

With the 27B's 1M mode, the limit is the KV pool, not the window. The proxy refuses a prompt past 92% of the pool, and the pool is decided at boot (832,993 to 922,094 tokens over sixteen 27B boots on the reference box). Sized on the smallest pool, use `700000` with the default output, or `529000` with `CLAUDE_CODE_EXTRA_BODY='{"max_tokens":250000}'`. Set to the window, a session grows past what the proxy accepts and is refused mid-conversation rather than compacted.

## A 500 error with ToolSearch in v1.40.2

With Claude Code's ToolSearch, which sends tool references in the conversation, the Qwen lanes of v1.40.2 answer with an HTTP 500 before generating. The fix is ready for the next release. Until then, start Claude Code with `ENABLE_TOOL_SEARCH=false`, in a new session.
