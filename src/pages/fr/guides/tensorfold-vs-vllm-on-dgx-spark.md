---
layout: ../../../layouts/Guide.astro
slug: tensorfold-vs-vllm-on-dgx-spark
lang: fr
title: "TensorFold contre vLLM sur DGX Spark : un checkpoint, mesuré"
description: "TensorFold 1.2.5 contre vLLM sur DGX Spark, même checkpoint FP4 176B : 69,7 contre 55,3 tok/s seul, chargé en 80 s contre 331 s, prompt à froid 25 % plus lent."
h1: "TensorFold est-il plus rapide que vLLM sur un DGX Spark ?"
published: "2026-11-10"
answer: "Sur une machine et un checkpoint, oui pour le décodage et non pour un prompt à froid. Avec le Qwen3.8-Flash-Next FP4-Local de NVIDIA (176B), TensorFold 1.2.5 a décodé <strong>26 % plus vite</strong> que vLLM seul (69,7 contre 55,3 tok/s, en glouton), s'est chargé en 80 s contre 331 s et a gardé 21,9 Gio de mémoire libre au plus bas contre 8,3. Son préremplissage à froid était <strong>25 % plus lent</strong> sur un prompt de 133 370 jetons. Mesuré le 2026-11-10. Alzeo sert toujours cette lane sur vLLM."
faq:
  - q: "TensorFold est-il plus rapide que vLLM sur un DGX Spark ?"
    a: "Pour une requête à la fois, oui sur ce checkpoint : une médiane gloutonne de 69,7 tok/s contre 55,3 sur des prompts courts, soit 26 % de plus. À 8 flux il a fini 200 problèmes de GSM8K en 798 s contre 968 s."
  - q: "Où TensorFold est-il plus lent ?"
    a: "Sur un prompt à froid. Le premier jeton d'un prompt de 133 370 jetons est arrivé après 75,7 s contre 60,5 s pour vLLM, soit 25 % plus tard, et le premier tour d'une conversation de 40 000 jetons après 21,6 s contre 17,7 s. Une fois le préfixe en cache, les deux répondent en 0,3 s environ."
  - q: "Combien de mémoire TensorFold laisse-t-il libre ?"
    a: "Sur la machine de référence de 128 Go, MemAvailable n'est jamais descendu sous 21,9 Gio avec TensorFold à 8 flux, contre 8,3 Gio avec vLLM sur le même checkpoint et les mêmes sondes."
  - q: "Quels réglages de TensorFold ont été mesurés ?"
    a: "Deux : ses réglages par défaut, qui servent 2 flux à la fois, et --parallel 8 avec TF_FLASHNEXT_KV_PAGES=256 pour un cache KV paginé. En charge, c'est le second qu'il faut prendre : GSM8K à 8 à la fois a pris 1 300 s avec les réglages par défaut et 798 s avec lui."
  - q: "TensorFold change-t-il la qualité des réponses ?"
    a: "Pas d'une façon que ce test puisse voir. Sur 200 problèmes de GSM8K à température 0 il a obtenu 0,99 contre 0,97 pour vLLM, un écart de 4 problèmes, ce qui reste dans le bruit d'un échantillon de 200."
  - q: "Alzeo installe-t-il TensorFold ?"
    a: "Non. La lane Qwen3.8 Flash-Next FP4-Local est servie par vLLM. Les vrais agents de code, les images, la fenêtre de 1M et une longue session n'ont pas été mesurés sur TensorFold, et rien ne change dans Alzeo avant qu'ils le soient."
sources:
  - label: "docs/flash-local-lane.md, la lane telle qu'Alzeo l'installe"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/flash-local-lane.md"
  - label: "TensorFold, le projet"
    href: "https://github.com/ashhart/TensorFold"
related:
  - label: "Tous les guides"
    href: "/fr/guides/"
  - label: "Quel moteur d'inférence faire tourner sur un DGX Spark ?"
    href: "/fr/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/"
  - label: "Tencent DSpine vaut-il la peine sur un DGX Spark ?"
    href: "/fr/guides/tencent-dspine-on-dgx-spark/"
---

## Qu'est-ce qui a été comparé ?

Deux moteurs sur les mêmes poids, sur la machine de référence (un ASUS Ascent GX10, GB10, 128 Go), en une nuit : le 2026-11-10, de 01:32 à 03:06. Le checkpoint est `nvidia/Qwen3.8-Flash-Next-FP4-Local` à la révision `b9ce18a`, le modèle de 176B, avec sa fenêtre de 262 144 jetons. Trois bras :

| Bras | Moteur | Flux | Prêt après |
|---|---|---|---|
| A | vLLM avec les noyaux b12x de NVIDIA, la lane telle qu'Alzeo l'installe (une lane est un modèle prêt à servir) | 8 | 331 s |
| B | TensorFold 1.2.5, ses réglages par défaut | 2 | 85 s |
| C | TensorFold 1.2.5, `--parallel 8` et `TF_FLASHNEXT_KV_PAGES=256` (cache KV paginé) | 8 | 80 s |

Chaque bras a été chargé à froid et a reçu les mêmes sondes dans le même ordre. La machine a refroidi sous 60 °C avant chaque chargement, chaque banc et chaque passage de GSM8K.

## Que disent les chiffres ?

| | A : vLLM | B : TensorFold, par défaut | C : TensorFold, 8 flux |
|---|---|---|---|
| `./bench.sh`, médiane gloutonne, trois passages (tok/s) | 57,1, 55,3, 55,2 | 67,1, 69,6, 69,7 | 69,6, 69,7, 69,7 |
| Passage du milieu | 55,3 | 69,6 | 69,7 |
| Code / raisonnement / prose libre, dernier passage (tok/s) | 59 / 52 / 34 | 72 / 68 / 42 | 72 / 68 / 42 |
| Conversation de 40 000 jetons, premier jeton du tour 1 (à froid) | 17,7 s | 22,1 s | 21,6 s |
| La même conversation, tours 2 à 6 (cache de préfixe) | 0,34 à 0,40 s | 0,24 à 0,26 s | 0,25 à 0,26 s |
| Prompt de 133 370 jetons, à froid, premier jeton | 60,5 s | 75,6 s | 75,7 s |
| Le même prompt renvoyé | 0,3 s | 0,3 s | 0,3 s |
| GSM8K, 200 problèmes, 8 à la fois, température 0 | 0,97 en 968 s | 0,99 en 1 300 s | 0,99 en 798 s |
| MemAvailable au plus bas pendant le passage | 8,3 Gio | 23,2 Gio | 21,9 Gio |

## Où TensorFold gagne-t-il ?

- **Décodage, une requête à la fois : 26 % plus vite.** 69,7 contre 55,3 tok/s, et les trois passages de chaque bras s'accordent à 3 tok/s près.
- **Huit flux : 18 % plus tôt** sur GSM8K avec le cache KV paginé (798 s contre 968 s).
- **Mémoire : 13,6 à 14,9 Gio de plus laissés libres** au point le plus bas. Sur une machine à mémoire unifiée, c'est la distance entre une machine détendue et une machine à 8 Gio d'un gel.
- **Chargement : quatre fois plus court**, 80 à 85 s contre 331 s.

Les deux scores de GSM8K, 0,99 et 0,97, sont à 4 problèmes d'écart sur 200. Ce n'est pas une différence que cet échantillon puisse montrer.

## Où vLLM gagne-t-il ?

- **Préremplissage à froid.** Un prompt de 133 370 jetons a mis 60,5 s jusqu'à son premier jeton sur vLLM et 75,6 à 75,7 s sur TensorFold, soit 25 % de plus. Le premier tour d'une conversation de 40 000 jetons a pris 17,7 s contre 21,6 à 22,1 s. Un agent qui commence par un long contexte le sent en premier.
- **Réglages par défaut en charge.** Les 2 flux par défaut de TensorFold ont mis 1 300 s sur le passage de GSM8K que vLLM a fini en 968 s. Avec `--parallel 8` et le cache KV paginé, il a mis 798 s.

Une fois un préfixe en cache, les deux moteurs ramènent un tour en bien moins d'une seconde : 0,34 à 0,40 s sur vLLM et 0,24 à 0,26 s sur TensorFold.

## Jusqu'où la machine a-t-elle chauffé ?

Aucune extinction, avec un ventilateur externe sur la machine. La zone thermique la plus chaude a culminé à 94,4 °C sous vLLM (pendant GSM8K), et à 96,8 °C et 97,5 °C sous les deux bras TensorFold, pendant le long prompt, quand le GPU tirait 90 W en préremplissage. Surveillez les zones ACPI si vous refaites ce test : cette machine s'est éteinte à 96,4 °C la veille au soir, sans le ventilateur.

## Qu'est-ce qui n'a pas été mesuré ?

Les vrais clients et les agents de code par le proxy (clé, abandon, raisonnement et appels d'outils), le comportement du cache de préfixe avec les harnais d'agent, les images (cette lane sert du texte et des images), la fenêtre de 1M, une longue session, et les réponses échantillonnées lues une par une. Une différence est apparue aux contrôles : TensorFold diffuse son raisonnement dans `reasoning_content`, là où cette lane vLLM utilise `reasoning`.

TensorFold est publié sous Apache-2.0. Le passage a laissé le checkpoint intact, n'a rien écrit hors de son propre dossier et n'a ouvert aucune connexion réseau.

## Faut-il changer ?

Ces chiffres valent pour une nuit, une machine et un checkpoint. Ils disent que TensorFold mérite un essai complet sur un DGX Spark : un décodage plus rapide, bien plus de mémoire laissée libre et un chargement plus court, pour un préremplissage à froid plus lent. Ils ne disent pas qu'il est prêt à remplacer vLLM sous de vrais agents. Alzeo sert cette lane sur vLLM, et ne changera pas cela avant que la liste ci-dessus soit mesurée.
