---
layout: ../../../layouts/Guide.astro
slug: speech-recognition-and-text-to-speech-dgx-spark
lang: fr
title: "Reconnaissance et synthèse vocales sur DGX Spark, sur le CPU"
description: "Qwen3-ASR comprend 30 langues et Kokoro en parle sept, sur le CPU d'un DGX Spark à côté de n'importe quel modèle, derrière des routes audio compatibles OpenAI."
h1: "Reconnaissance et synthèse vocales sur un DGX Spark"
published: "2026-10-26"
installNote: "Installez d'abord la pile avec cette commande, puis lancez ./install-speech.sh depuis le clone, et relancez-le après chaque mise à jour."
answer: "Lancez <code>./install-speech.sh</code> après l'installation : Qwen3-ASR reconnaît la parole dans 30 langues et Kokoro-82M parle avec 41 voix dans sept langues, derrière des routes audio compatibles OpenAI. Tout tourne sur le CPU seul, et cohabite donc avec la lane (un modèle prêt à servir) qui sert, quelle qu'elle soit."
faq:
  - q: "Un DGX Spark peut-il transcrire la parole en local ?"
    a: "Oui. Qwen3-ASR reconnaît la parole dans 30 langues sur le CPU de la machine, derrière une route audio compatible OpenAI, et répond au SDK officiel d'OpenAI sans modification."
  - q: "La voix ralentit-elle le modèle qui sert ?"
    a: "Non. Elle utilise cinq petits cœurs du CPU pour chaque moteur et aucune mémoire GPU. Avec les deux moteurs vocaux occupés, le décodage de la lane flash n'a pas bougé (47,5 tok/s)."
  - q: "Quels fichiers audio lit-elle ?"
    a: "Tout audio que lit ffmpeg, comme le m4a d'un téléphone ou le webm d'un navigateur. Les longs enregistrements sont coupés en morceaux de 30 s à leurs moments de silence."
  - q: "La voix fait-elle partie de l'installation en une seule commande ?"
    a: "Pas encore. Elle est facultative : depuis un clone, après ./install.sh, lancez ./install-speech.sh. Cela prend environ 3 minutes, et son fonctionnement est prouvé avant la fin. Les mises à jour par la commande unique la laissent telle quelle : relancez donc ./install-speech.sh après chacune."
sources:
  - label: "README.md, reconnaissance et synthèse vocales"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md#speech-qwen3-asr-and-kokoro-on-the-cpu-beside-any-lane"
  - label: "docs/speech-lane.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/speech-lane.md"
related:
  - label: "Une API compatible OpenAI sur un DGX Spark"
    href: "/fr/guides/openai-compatible-api-dgx-spark/"
---

## Comment installer la voix sur mon Spark ?

```bash
./install-speech.sh    # from a clone, after ./install.sh: about 3 minutes, proved before it ends
```

La voix est facultative et ne fait pas encore partie de l'installation en une seule commande. Elle installe deux moteurs derrière des routes audio compatibles OpenAI sur `127.0.0.1:30024`, sur la machine.

## Que reconnaît-elle, et que dit-elle ?

- **Qwen3-ASR** reconnaît la parole dans 30 langues.
- **Kokoro-82M** parle avec 41 voix dans sept langues.

Les deux répondent au SDK officiel d'OpenAI sans modification.

## Prend-elle de la mémoire aux modèles ?

Un peu. Elle tourne sur le CPU seul, cinq petits cœurs pour chaque moteur, et n'alloue aucune mémoire GPU. Mais sur un GB10, le CPU et le GPU partagent une seule mémoire : quand elle tourne, la lane occupe 2,5 Go au repos et 2,7 Go en travail avec le modèle de reconnaissance 0.6B (4,2 Go avec le 1.7B), une mémoire que veulent aussi les longs prompts d'une lane flash. C'est pourquoi elle n'est pas lancée au démarrage de la machine, sauf avec `SPEECH_BOOT=1`. Avec les deux moteurs vocaux occupés, le décodage de la lane flash n'a pas bougé (47,5 tok/s).

## Quels enregistrements puis-je envoyer ?

Tout audio que lit ffmpeg, dont le m4a d'un téléphone ou le webm d'un navigateur. Les longs enregistrements sont coupés en morceaux de 30 s à leurs moments de silence.

## Où sont les détails ?

Les langues, chaque chiffre et les limites sont dans [docs/speech-lane.md](https://github.com/hasso5703/alzeo/blob/main/docs/speech-lane.md).
