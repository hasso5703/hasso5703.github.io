---
layout: ../../../layouts/Guide.astro
slug: claude-code-local-model-dgx-spark
lang: fr
title: "Claude Code avec un modèle local sur DGX Spark, réglé pour vous"
description: "Claude Code sur le modèle que sert votre DGX Spark : claude-local fixe le point de terminaison, la clé et les limites de la lane, sans rien envoyer à Anthropic."
h1: "Claude Code avec un modèle local sur un DGX Spark"
published: "2026-10-26"
answer: "Lancez <code>claude-local</code> sur la machine. L'installeur le place dans <code>~/.local/bin</code> : il démarre Claude Code sur la lane (un modèle prêt à servir) que sert la machine, par la route Anthropic du proxy, avec la clé, le modèle, les délais d'attente et le budget de contexte adaptés à cette lane. Rien de la session ne part chez Anthropic ni chez un autre fournisseur."
faq:
  - q: "Claude Code peut-il utiliser un modèle local sur un DGX Spark ?"
    a: "Oui. La machine sert une route compatible Anthropic par son proxy, sur le port 30001, et claude-local démarre Claude Code sur cette route avec les limites de la lane qui sert."
  - q: "Claude Code envoie-t-il mon code à Anthropic quand il tourne sur le modèle de la machine ?"
    a: "Non. Les requêtes au modèle vont à la machine, et claude-local coupe le reste du trafic de Claude Code : la télémétrie, les rapports d'erreur, les mises à jour, les indicateurs de fonctionnalité, les connecteurs claude.ai d'un compte connecté et l'enregistrement de la place de marché officielle."
  - q: "Pourquoi Claude Code compacte-t-il plus tôt avec un modèle local ?"
    a: "Parce que son budget de contexte est ajusté au pool mémoire de la lane qui sert, pas à la fenêtre d'un modèle du cloud. Un prompt qui dépasse ce que le pool peut contenir est refusé par le proxy, et Claude Code compacte puis continue."
  - q: "Le WebSearch de Claude Code fonctionne-t-il avec un modèle local ?"
    a: "Non. Le WebSearch intégré à Claude Code s'exécute chez Anthropic. Un serveur MCP à vous fait la recherche à sa place, et vos propres serveurs MCP sont conservés."
  - q: "Puis-je faire tourner Claude Code sur mon ordinateur portable avec le modèle du Spark ?"
    a: "Oui. Pointez ANTHROPIC_BASE_URL sur le port 30001 de la machine, mettez la clé API dans ANTHROPIC_AUTH_TOKEN, et réglez le budget de contexte et le budget de réponse indiqués sur cette page."
sources:
  - label: "docs/clients.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/clients.md"
  - label: "README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md"
related:
  - label: "Que faire tourner sur un DGX Spark de 64 Go"
    href: "/fr/dgx-spark-64gb/"
  - label: "Tous les guides"
    href: "/fr/guides/"
---

## Comment fonctionne claude-local ?

Claude Code passe par la route Anthropic du proxy, `/v1/messages`. `claude-local` règle, pour le seul processus qu'il démarre, le proxy, la clé (lue dans son fichier à chaque lancement, dans l'environnement uniquement), le modèle qui sert, les délais d'attente, ainsi que le budget de contexte et le budget de réponse adaptés à cette lane. Puis il lance `claude` avec vos arguments. Votre `~/.claude` reste intact.

Le contexte, le budget de réponse, le modèle et les délais d'attente que vous réglez vous-même sont conservés. Le point de terminaison et la clé sont toujours ceux de la machine. Il atteint la machine directement, jamais par un proxy HTTP que désigne votre shell.

```bash
claude-local                 # Claude Code on the lane the box serves
claude-local --continue      # any argument goes to claude
```

## Quel budget de contexte et de réponse donne-t-il à chaque lane ?

La paire vient des limites opencode de la lane, que l'installeur et le cockpit ajustent à son pool mémoire, à sa fenêtre et au plafond du proxy. Le budget de contexte de Claude Code (`CLAUDE_CODE_MAX_CONTEXT_TOKENS`) est le contexte d'opencode plus 23 000, et son budget de réponse (`max_tokens`) est celui d'opencode.

| Lane | Budget de contexte | Budget de réponse |
|---|---|---|
| Qwen3.8 Flash-Next FP4-Local | 228 000 | 32 000 |
| Qwen3.8-27B dans son mode 1M | 578 000 | 185 000 |
| Une lane pour laquelle opencode n'a pas de limites | 205 000 | 32 000 |

Sur une machine de 64 Go, le pool de la 27B est plus petit : l'ajustement d'opencode lui donne alors 37 000 et 12 000.

## Quelque chose part-il chez Anthropic ?

Non. Les requêtes au modèle, y compris celles du classifieur du mode auto, vont à la machine, et `claude-local` coupe le reste, quoi qu'en disent votre shell, vos propres réglages ou ceux d'un projet : le trafic non essentiel de Claude Code (télémétrie, rapports d'erreur, `/feedback`, mises à jour, indicateurs de fonctionnalité), les connecteurs claude.ai d'un compte connecté, l'enregistrement de la place de marché officielle, l'attente par le mode auto des vérifications du serveur, la vérification du nom d'hôte par WebFetch auprès d'api.anthropic.com, et les autres fournisseurs que Claude Code lit avant le point de terminaison.

Le WebSearch intégré à Claude Code s'exécute chez Anthropic et ne fonctionne pas avec un modèle local. Un serveur MCP à vous fait la recherche à sa place.

## Demande-t-il avant d'exécuter des commandes ?

Depuis la v1.40.2, une session `claude-local` démarre dans le mode de permission normal de Claude Code, qui demande avant chaque commande, sauf si vous passez votre propre mode (`--permission-mode auto`, ou `--dangerously-skip-permissions`).

## Comment le configurer à la main, depuis un autre ordinateur ?

Pointez Claude Code sur le port 30001 de la machine, avec la clé API de la machine. Les deux dernières lignes tiennent la session à l'écart d'Anthropic, avec `"skipWebFetchPreflight": true` dans vos réglages :

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

## Qu'est-ce qui change avec la fenêtre de 1M de jetons ?

Avec le mode 1M de la 27B, la limite est le pool KV, pas la fenêtre. Le proxy refuse un prompt qui dépasse 92 % du pool, et le pool est décidé au démarrage (de 832 993 à 922 094 jetons sur seize démarrages de la 27B sur la machine de référence). En dimensionnant sur le plus petit pool, utilisez `700000` avec la sortie par défaut, ou `529000` avec `CLAUDE_CODE_EXTRA_BODY='{"max_tokens":250000}'`. Avec un réglage sur la fenêtre, une session grossit au-delà de ce que le proxy accepte et se voit refusée en pleine conversation au lieu d'être compactée.

## ToolSearch fonctionne depuis la v1.40.3

Avec le ToolSearch de Claude Code, qui envoie des références d'outils dans la conversation, les lanes Qwen de la v1.40.2 répondaient par une erreur HTTP 500 avant de générer. La v1.40.3 (2026-10-26) l'a corrigé. Une machine en v1.40.2 reçoit le correctif quand on relance la commande d'installation ; `ENABLE_TOOL_SEARCH=false` était le contournement jusque-là.
