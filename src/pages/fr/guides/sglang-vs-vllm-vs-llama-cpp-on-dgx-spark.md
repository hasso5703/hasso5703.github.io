---
layout: ../../../layouts/Guide.astro
slug: sglang-vs-vllm-vs-llama-cpp-on-dgx-spark
lang: fr
title: "SGLang vs vLLM vs llama.cpp : mesurés sur un même DGX Spark"
description: "SGLang, vLLM et llama.cpp sur DGX Spark : le modèle brouillon et le contenu pèsent plus que le moteur. Code : SGLang + DSpark 28-32 tok/s, llama.cpp 25-26."
h1: "Quel moteur d'inférence faire tourner sur un DGX Spark ?"
published: "2026-10-26"
answer: "Sur un DGX Spark, le modèle brouillon et ce que vous générez comptent plus que le moteur : avec le même checkpoint Qwen3.8-27B et le même modèle brouillon, un passage sur vLLM chez un possesseur et le SGLang de ce dépôt sont arrivés dans la même fourchette. Sur la même batterie, un modèle brouillon par blocs sur SGLang menait sur le code (<strong>28 à 32 tok/s</strong>, contre 25 à 26 pour llama.cpp réglé), alors que de simples têtes MTP tenaient mieux sur la prose libre. Cet installeur fait tourner Qwen3.8-27B et Flash-Next sur SGLang et cinq autres lanes (des modèles prêts à servir) sur vLLM, avec un moteur choisi modèle par modèle."
faq:
  - q: "vLLM ou SGLang : lequel est le plus rapide sur un DGX Spark ?"
    a: "Aucun des deux sur toutes les tâches. Avec le même checkpoint Qwen3.8-27B et le même modèle brouillon, ils sont arrivés dans la même fourchette, et sur Ornith 1.5 122B, SGLang était plus rapide en requête seule sur le code, le raisonnement et les maths, vLLM sur la prose libre, et les deux se tenaient à 6 % l'un de l'autre à 4 et 8 requêtes."
  - q: "llama.cpp est-il plus lent que SGLang sur un DGX Spark ?"
    a: "Sur le même Qwen3.8-27B et la même batterie, llama.cpp réglé a mesuré 25,6 tok/s en code agentique, contre 32 à 40 pour SGLang avec le modèle brouillon DFlash2 v1.2, et 17,7 à 18,2 tok/s en prose contre 17 à 22. Il tourne bien sur GB10, et c'est le moteur à choisir quand un modèle affiné n'existe qu'en GGUF."
  - q: "Pourquoi la prose libre est-elle plus lente que le code ?"
    a: "Un modèle brouillon ne rapporte que lorsque le modèle accepte ses jetons, et la prose est moins prévisible que le code. Sur la machine de référence, la prose libre en anglais tournait 2 fois plus lentement que le code en anglais avec la même configuration, et l'allemand plus lentement que le français, lui-même plus lent que l'anglais."
  - q: "Le décodage spéculatif change-t-il les réponses ?"
    a: "Non. L'étape de vérification n'accepte que les jetons que le modèle cible aurait émis : la sortie reste celle du modèle, et seule la vitesse change."
  - q: "Quels moteurs cet installeur utilise-t-il ?"
    a: "SGLang pour Qwen3.8-27B, Qwen3.8-Flash-Next et les lanes d'images et de vidéo, vLLM pour Qwen3.8 Flash-Next FP4-Local, Kolibri-1, Nemotron 3.5 Bolt, Nemotron 3.5 Super VL et Ornith 1.5 122B, et llama.cpp pour la reconnaissance vocale facultative, sur le CPU."
  - q: "Obtiendrai-je les mêmes chiffres sur mon Spark ?"
    a: "Pas exactement. Ce sont des mesures à un instant donné sur une seule machine, et les longueurs d'acceptation, donc les tok/s, varient avec la charge de travail et la langue. ./bench-matrix.sh fait passer la même batterie figée sur n'importe quel moteur, sur votre propre machine."
sources:
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/BENCHMARKS.md"
  - label: "README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md"
  - label: "docs/ornith-lane.md, le moteur"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/ornith-lane.md#the-engine-vllm-with-the-models-own-mtp-head"
  - label: "extras/gguf/README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/extras/gguf/README.md"
  - label: "CHANGELOG.md, v1.5"
    href: "https://github.com/hasso5703/alzeo/blob/main/CHANGELOG.md"
  - label: "docs/speech-lane.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/speech-lane.md"
related:
  - label: "Tous les guides"
    href: "/fr/guides/"
  - label: "Il tourne sur toutes les machines GB10"
    href: "/fr/machines/"
  - label: "Que faire tourner sur un DGX Spark de 64 Go"
    href: "/fr/dgx-spark-64gb/"
---

## Quel moteur est le plus rapide sur un DGX Spark ?

Aucun sur toutes les tâches, et le matériel explique pourquoi. Sur un GB10, le décodage d'un seul flux d'un modèle dense est limité par la bande passante mémoire : la puce annonce 273 Go/s, environ 225 Go/s sont mesurables, et chaque étape de décodage lit tous les poids. Deux leviers font bouger le résultat : les octets que lit chaque étape (la quantification) et les jetons que chaque étape accepte (le décodage spéculatif, où un modèle brouillon propose des jetons que le modèle vérifie, si bien que la sortie ne change pas).

Un possesseur extérieur a fait passer la batterie de ce dépôt sur vLLM 0.27-dev avec le même checkpoint Qwen3.8-27B NVFP4 épinglé et le même modèle brouillon DSpark, sur une machine au repos. Le plancher en prose était identique, et les cases des tâches structurées se situaient 15 à 25 % au-dessus de celles du dépôt, mesurées sur une machine qui servait à ce moment-là ses propres sessions d'agent. La lecture du dépôt : à matériel, quantification et modèle brouillon identiques, cette voie vLLM et SGLang arrivent dans la même fourchette, et la charge de la machine et le contenu sont les leviers.

## Comment SGLang, vLLM et llama.cpp se comparent-ils sur le même modèle ?

Sur la machine de référence, un ASUS Ascent GX10, le dépôt a d'abord fait passer Qwen3.8-27B par les trois moteurs le même jour, en août 2026 :

| Moteur et configuration | Code et maths, prompts en français | Style évaluation, en anglais |
|---|---|---|
| llama.cpp UD-Q4_K_XL + MTP n=3, réglé | ~27 tok/s | 24 à 30 tok/s |
| vLLM 0.27 NVFP4 + MTP n=3, recette officielle | ~24,5 tok/s | n/d |
| SGLang NVFP4 + DSpark (ce dépôt, v1.0 à v1.1) | ~34 tok/s | 38,0 en moyenne, 46,7 en pic |

Puis est venue sa batterie figée (`./bench-matrix.sh`, décodage glouton), avec SGLang pilotant la propre tête MTP du checkpoint comme témoin :

| Charge de travail (tok/s) | SGLang + DSpark | SGLang + MTP | llama.cpp + MTP n=3, réglé |
|---|---|---|---|
| Problèmes de maths rédigés (EN) | 37 à 38 | 27,7 | n/d |
| Code (EN) | 28 à 32 | 23,3 | 25 à 26 |
| Code (DE) | 24 à 25 | 24,1 | 21 à 25 |
| Raisonnement (FR) | 31,6 | 30,3 | 27 à 28 |
| Prose libre (EN) | 16 | 20,1 | 17,7 |
| Prose libre (FR) | 13 | 20,8 | 18,2 à 18,4 |
| Prose libre (DE) | 12,3 | 18,8 | 17 à 18 |

Le modèle brouillon par blocs a le plafond le plus haut sur la sortie structurée, et un plancher sur la prose. Les moteurs à MTP se tiennent dans un milieu stable, et SGLang avec MTP était le meilleur d'entre eux sur la prose, devant llama.cpp là aussi. La note GGUF du dépôt ajoute le préremplissage, qu'une boucle d'agent ressent en premier : sa voie spéculative SGLang mesurait environ 3 fois mieux que les moteurs à MTP stable auxquels elle était comparée, llama.cpp compris.

Les modèles brouillons ont continué de progresser. Avec le modèle brouillon DFlash2 NVFP4 calibré avec lequel la lane 27B sert depuis la v1.9, la même batterie a mesuré 40 tok/s sur le code en anglais et 34 en allemand, et 22 / 20 / 18 sur la prose en anglais, en français et en allemand, contre 24 à 28 et 17 à 20 pour les moteurs à MTP stable. Le chiffre phare de la lane aujourd'hui est une médiane gloutonne de 65,2 à 68,5 tok/s sur `./bench.sh` (deux passages le 2026-11-05, SGLang 0.5.22 sans torch.compile), après 71,4 sur SGLang 0.5.19 avec torch.compile (2026-09-17).

## Ce que vous générez change-t-il la vitesse ?

Plus que le moteur. Un possesseur indépendant a comparé en A/B la configuration de ce dépôt à vLLM 0.26.1 avec MTP sur une même machine, le moteur et le checkpoint changeant ensemble : SGLang menait sur la sonde de code, 32,8 contre 25,1 tok/s, et vLLM menait sur six prompts variés, dont la moitié en allemand, 24,7 contre 19,5. La tête MTP de vLLM gardait une acceptation stable (4,35 à 4,77) sur tout ce qu'ils ont essayé, alors que le modèle brouillon DSpark séparé acceptait 2,80 à 5,42 jetons sur les sondes du dépôt et 1,25 à 1,52 sur la prose allemande. Le dépôt a reproduit l'effet sur sa propre machine :

| Contenu | tok/s | Longueur moyenne d'acceptation |
|---|---|---|
| Code, prompt en anglais | 32,9 à 40,5 | 3,3 |
| Code, prompt en allemand | 22,9 | 2,6 |
| Explication technique, en français | 18,4 | 2,2 |
| Prose libre, en anglais | 16,6 | 2,1 |
| Prose libre, en français | 13,7 | 1,9 |
| Prose libre, en allemand | 12,2 | 1,5 à 1,7 |
| Problèmes de maths rédigés, style évaluation (temp 0,6) | 43 à 47 | ~4,9 |

Le type de contenu passe en premier : la prose libre en anglais tournait 2 fois plus lentement que le code en anglais avec la même configuration. La langue vient ensuite : l'anglais devant le français, lui-même devant l'allemand. Dans l'A/B du possesseur, l'avantage en latence ne dépendait pas du contenu : le temps jusqu'au premier jeton sur du texte était de 0,22 à 0,28 s sur SGLang, contre 0,33 à 0,34 s sur vLLM.

## SGLang ou vLLM : lequel est meilleur pour le même modèle ?

Sur Ornith 1.5 122B, le dépôt a fait tourner les deux moteurs l'un après l'autre la même nuit, chacun avec son propre modèle brouillon, à la fenêtre native du modèle :

| Ornith 1.5 122B | vLLM, brouillon MTP de 2 jetons | SGLang nightly, brouillon DFlash2 de 8 jetons |
|---|---|---|
| Une requête : code / prose libre | 42,2 / 30,8-32,2 tok/s | 53,7-53,8 / 25,2-25,3 tok/s |
| Une requête : raisonnement / maths | 42,5-43,3 / 41,1-42,7 tok/s | 65,8-67,6 / 69,8-74,5 tok/s |
| Cinq vraies tâches, 4 / 8 à la fois | 64,2 / 88,3 tok/s | 63,0 / 93,2 tok/s |
| Cache KV à une fenêtre d'un million | 1 301 680 jetons | 566 943 jetons |
| Démarrage, caches déjà construits | 2 min 46 s à 3 min 46 s | 11 min 30 s à 11 min 51 s |

Le modèle brouillon de SGLang gagne là où le texte est prévisible et où une requête tourne seule. vLLM gagne sur la prose libre et les jetons aléatoires, tient toute la fenêtre et démarre quatre fois plus vite, et à 4 et 8 requêtes les deux sont à moins de 6 % l'un de l'autre. SGLang reprend depuis son cache le tour suivant d'un agent en 0,2 à 0,3 s, contre 5,3 à 5,6 s pour vLLM, délai qu'une option de cette version de vLLM a ensuite ramené à 0,54 à 0,58 s sur un second GX10.

Les deux lanes Flash-Next se partagent aussi les victoires (des versions différentes du modèle, donc pas un pur test de moteur) : vLLM était plus rapide en requête seule (47,4 contre 43,8 tok/s) et en préremplissage (2 141 contre 1 617 tok/s sur un prompt de 32K), SGLang à 8 requêtes (123,7 contre 106,6).

## Quel moteur cet installeur fait-il tourner pour chaque lane, et pourquoi ?

| Lane | Moteur | Pourquoi |
|---|---|---|
| Qwen3.8-27B (quatre cibles) | SGLang + DFlash2 | la configuration la plus rapide que le dépôt a mesurée pour elle |
| Qwen3.8 Flash-Next (176B, trois versions) | SGLang + NEXTN | a quitté vLLM en v1.5 (août 2026), quand le cache de préfixe fonctionnait sur SGLang et qu'un bogue propre au GB10 le bloquait sur vLLM : une conversation de 30K jetons revenait en 0,5 s au lieu de 18,4 s |
| Qwen3.8 Flash-Next FP4-Local | vLLM | la version de Flash-Next faite par NVIDIA, lancée avec la commande que donne sa fiche de modèle pour un DGX Spark |
| Kolibri-1 | vLLM + le greffon d'Aleph Alpha | SGLang ne peut pas le charger |
| Nemotron 3.5 Bolt, Super VL | vLLM | la façon dont les fiches de modèle de NVIDIA les servent sur un DGX Spark |
| Ornith 1.5 122B | vLLM | toute la fenêtre d'un million de jetons, une vitesse qui tient sur tout texte, un démarrage plus court |
| Qwen-Image 2.1, vidéo MiniMax-H3 | SGLang | la vidéo suit la recette du cookbook de SGLang, vérifiée sur le DGX Spark |
| Reconnaissance vocale (facultative) | llama.cpp `llama-server`, sur le CPU | aucune mémoire GPU, elle tourne donc à côté de n'importe quelle lane |

## Quel moteur choisir ?

- **Code agentique, appels d'outils, maths, raisonnement structuré** : SGLang avec un modèle brouillon par blocs, qui a gagné chaque ligne pertinente de la comparaison sur la même batterie.
- **Surtout de la prose libre ou des langues mélangées** : mesurez le modèle brouillon sur votre propre contenu. Une simple tête MTP battait sur la prose le modèle brouillon par blocs d'août, le modèle brouillon actuel de la 27B a comblé cet écart, et sur Ornith la tête MTP de vLLM menait encore sur la prose libre.
- **Longues fenêtres, tout type de texte, redémarrages rapides** : vLLM, d'après les chiffres d'Ornith.
- **Un modèle affiné qui n'existe qu'en GGUF** : llama.cpp tourne bien sur GB10, à 25,6 tok/s en code agentique contre 32 à 40 pour SGLang avec le modèle brouillon DFlash2 v1.2, sur la même 27B.

Les chiffres du dépôt sont des mesures à un instant donné sur une seule machine, et vos longueurs d'acceptation, donc vos tok/s, varieront avec la charge de travail et la langue. `./bench-matrix.sh` fait passer la même batterie figée sur n'importe quel moteur, sur votre propre machine.
