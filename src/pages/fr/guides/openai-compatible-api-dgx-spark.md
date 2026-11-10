---
layout: ../../../layouts/Guide.astro
slug: openai-compatible-api-dgx-spark
lang: fr
title: "Une API compatible OpenAI sur DGX Spark : Open WebUI, Cursor, SDK"
description: "Pointez Open WebUI, Cursor, Continue, Zed ou le SDK OpenAI sur votre DGX Spark : une URL de base sur le port 30001 et une clé API. Tout nom de modèle convient."
h1: "Une API compatible OpenAI sur un DGX Spark"
published: "2026-10-26"
answer: "Tout ce qui accepte une <code>base_url</code> et une clé API se pointe sur <code>http://&lt;your-spark&gt;:30001/v1</code>, avec la clé API de la machine comme jeton. Le client peut envoyer n'importe quel nom de modèle : la lane (un modèle prêt à servir) qui sert lui répond."
faq:
  - q: "Quelle URL de base donner à Open WebUI pour un DGX Spark ?"
    a: "OPENAI_API_BASE_URL=http://&lt;your-spark&gt;:30001/v1, avec la clé API de la machine. La découverte des modèles par GET /v1/models répond à travers le proxy."
  - q: "Quel nom de modèle mon client doit-il envoyer ?"
    a: "N'importe lequel. La lane qui sert y répond, par exemple qwen3.8-27b sur la 27B."
  - q: "La machine parle-t-elle aussi l'API Anthropic ?"
    a: "Oui. Le même port sert la route Anthropic, /v1/messages, qu'utilise Claude Code."
  - q: "Ai-je besoin d'une clé API ?"
    a: "Oui. Le proxy vérifie la clé avant de lire le corps d'une requête, et une requête sans clé reçoit une réponse 401. Les routes de santé et de métriques restent ouvertes."
  - q: "Puis-je joindre le moteur directement sur le port 30000 ?"
    a: "Seulement depuis la machine elle-même : depuis la v1.17, le moteur écoute sur 127.0.0.1. Les clients se connectent au proxy sur 30001, qui ajoute des keepalives et refuse ce qui ferait tomber le moteur."
sources:
  - label: "docs/clients.md, clients standard compatibles OpenAI"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/clients.md"
related:
  - label: "Claude Code avec un modèle local sur un DGX Spark"
    href: "/fr/guides/claude-code-local-model-dgx-spark/"
  - label: "opencode avec un modèle local sur un DGX Spark"
    href: "/fr/guides/opencode-local-model-dgx-spark/"
---

## Quelles sont l'URL de base et la clé ?

```bash
base_url = http://<your-spark>:30001/v1
api_key  = the API key the installer created on the box
```

Le port 30001 est le proxy keepalive placé devant le moteur. Il parle les routes OpenAI (`/v1/chat/completions`, `/v1/completions`, `/v1/models`) et la route Anthropic (`/v1/messages`).

## Comment connecter Open WebUI ?

Réglez `OPENAI_API_BASE_URL=http://<your-spark>:30001/v1` et la clé comme ci-dessus. La découverte des modèles par `GET /v1/models` répond à travers le proxy : la lane qui sert apparaît donc comme un modèle.

## Comment connecter Cursor, Continue ou Zed ?

Utilisez leur fournisseur OpenAI avec la même URL de base et la même clé. Pour les requêtes avec des images, le proxy compte les jetons de chaque image à partir de l'en-tête de l'image elle-même et de la géométrie de l'encodeur de vision.

## Et le SDK OpenAI ?

```python
from openai import OpenAI

client = OpenAI(base_url="http://<your-spark>:30001/v1", api_key="<key>")
reply = client.chat.completions.create(
    model="qwen3.8-27b",
    messages=[{"role": "user", "content": "Hello from my Spark"}],
)
print(reply.choices[0].message.content)
```

N'importe quel nom de modèle convient : la lane qui sert y répond.

## Pourquoi le proxy et pas le moteur ?

Le proxy envoie les keepalives qui empêchent les chiens de garde des clients de tuer les longs préremplissages, interrompt les décodages quand un client disparaît, et refuse, avant qu'elles ne l'atteignent, les requêtes qui feraient tomber le moteur, avec une réponse sur laquelle un client peut agir. Le port du moteur parle les mêmes API sans cette protection, et depuis la v1.17 il ne répond que sur la machine.

## Quels clients sont mesurés, et lesquels sont configurés ?

Claude Code et opencode sont mesurés sur la machine de référence. Open WebUI, Cursor, Continue et Zed sont configurés avec les champs OpenAI standard de leurs éditeurs, et ne sont pas mesurés ici. Si l'un d'eux contredit cette page, c'est un ticket box-report avec le corps exact de la requête du client qui la fera évoluer.
