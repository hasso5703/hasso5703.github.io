---
layout: ../../../layouts/Guide.astro
slug: ollama-slow-on-dgx-spark
lang: fr
title: "Ollama lent sur DGX Spark ? Retours des possesseurs et mesures"
description: "Des possesseurs trouvent Ollama lent sur DGX Spark. Leurs pistes, quoi vérifier, et un test sur un même banc : vLLM 60,7 tok/s, Ollama 42,1 sur GPT-OSS-120B."
h1: "Pourquoi Ollama est-il lent sur mon DGX Spark ?"
published: "2026-10-26"
answer: "Ce projet n'a jamais mesuré Ollama. Les possesseurs qui l'ont trouvé lent sur un Spark pointent trois choses : un modèle qui tourne sur le CPU au lieu du GPU, l'image Docker d'Ollama, et les modèles denses, dont chaque poids est lu à chaque jeton. Dans le test d'un possesseur, avec le même banc de mesure pour chaque moteur, vLLM devançait Ollama en requête seule sur trois modèles sur quatre (<strong>60,7 contre 42,1 tok/s</strong> sur GPT-OSS-120B), et sur les quatre à 8 requêtes simultanées, où le débit total d'Ollama restait à son chiffre sur un seul flux."
faq:
  - q: "Alzeo a-t-il mesuré Ollama ?"
    a: "Non. Ses mesures portent sur SGLang, vLLM et llama.cpp, sur une seule machine de référence. Ce que cette page dit d'Ollama vient des retours publics de possesseurs et des chiffres publiés par Ollama lui-même, chacun avec son lien."
  - q: "Pourquoi Ollama affiche-t-il 0 % de GPU sur mon DGX Spark ?"
    a: "Un possesseur qui avait installé Ollama avec Open WebUI voyait 0 % de GPU et 100 % de CPU, et le fil ne consigne pas la cause. Un autre a découvert avec ollama ps qu'un modèle s'était chargé à 66 % sur le CPU et à 34 % sur le GPU, et le décharger puis le recharger a ramené la vitesse de 16 à 40 tok/s."
  - q: "L'image Docker d'Ollama est-elle plus lente sur un DGX Spark ?"
    a: "Des possesseurs le signalent dans le fil 353456 du forum NVIDIA, et l'un d'eux dit que les performances sont redevenues normales après avoir réinstallé Ollama en natif. Ce projet ne l'a pas mesuré."
  - q: "De combien vLLM est-il plus rapide qu'Ollama sur un DGX Spark ?"
    a: "Cela dépend du modèle et de la charge. Dans le test d'un possesseur, avec le même banc de mesure pour chaque moteur, vLLM était plus rapide en requête seule sur trois modèles sur quatre (60,7 contre 42,1 tok/s sur GPT-OSS-120B), Ollama sur le quatrième (85,2 contre 77,1 sur Qwen3-30B-A3B), et à 8 requêtes simultanées vLLM atteignait 289 à 313 tok/s sur trois d'entre eux."
  - q: "Pourquoi qwen3:32b est-il lent sur un DGX Spark ?"
    a: "Il est dense : ses 32 milliards de paramètres sont tous actifs, et chaque étape de décodage lit tous les poids à travers une mémoire qui mesure environ 225 Go/s. Le tableau d'Ollama lui-même le donne à 9,411 tok/s en q4_K_M, contre 58,27 pour gpt-oss 20B en MXFP4, un mélange d'experts."
  - q: "Ces chiffres seront-ils les mêmes sur mon Spark ?"
    a: "Pas exactement. Chacun est une mesure à un instant donné sur une seule machine, et la vitesse varie avec le modèle, le contenu et la langue : chronométrez le même prompt sur votre propre machine avant de décider."
sources:
  - label: "Forum NVIDIA : très mauvaises performances d'Ollama sur DGX Spark"
    href: "https://forums.developer.nvidia.com/t/very-poor-performance-with-ollama-on-dgx-spark-looking-for-help/353456"
  - label: "Forum NVIDIA : des modèles qui n'utilisent pas le GPU du Spark ?"
    href: "https://forums.developer.nvidia.com/t/models-not-using-spark-gpu/354600"
  - label: "Forum NVIDIA : performances du DGX Spark"
    href: "https://forums.developer.nvidia.com/t/dgx-spark-performance/356716"
  - label: "Forum NVIDIA : le même banc de mesure pour Ollama, llama.cpp et vLLM"
    href: "https://forums.developer.nvidia.com/t/measured-inference-benchmarks-on-a-single-dgx-spark-same-harness-across-ollama-llama-cpp-and-vllm-notes-data-published/379766"
  - label: "ai-muninn : vLLM contre Ollama sur le même modèle"
    href: "https://ai-muninn.com/en/blog/dgx-spark-vllm-vs-ollama-same-model"
  - label: "Blog d'Ollama : performances du NVIDIA DGX Spark"
    href: "https://ollama.com/blog/nvidia-spark-performance"
  - label: "Blog d'Ollama : NVIDIA DGX Spark"
    href: "https://ollama.com/blog/nvidia-spark"
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/BENCHMARKS.md"
  - label: "extras/gguf/README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/extras/gguf/README.md"
  - label: "README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md"
related:
  - label: "Tous les guides"
    href: "/fr/guides/"
  - label: "Il tourne sur toutes les machines GB10"
    href: "/fr/machines/"
  - label: "Que faire tourner sur un DGX Spark de 64 Go"
    href: "/fr/dgx-spark-64gb/"
---

## Ce projet a-t-il mesuré Ollama ?

Non. Ses mesures portent sur SGLang, vLLM et llama.cpp, sur une seule machine de référence, un ASUS Ascent GX10, et aucun de ces moteurs n'est Ollama. Ce que cette page dit d'Ollama vient des retours publics de possesseurs et des chiffres publiés par Ollama lui-même, chacun avec son lien, et aucune comparaison ici ne va au-delà de ce que sa source a mesuré. Ollama est un bon outil, qui a une vraie place sur un Spark, et il s'est [associé à NVIDIA](https://ollama.com/blog/nvidia-spark) pour le lancement.

## Que signalent les possesseurs à propos d'Ollama sur un DGX Spark ?

- **L'image Docker.** Dans [« Very poor performance with Ollama on DGX Spark »](https://forums.developer.nvidia.com/t/very-poor-performance-with-ollama-on-dgx-spark-looking-for-help/353456), l'auteur du fil faisait tourner un modèle GPT OSS 20B dans Docker et jugeait les performances catastrophiques, avec une utilisation du GPU autour de 89 %. Un deuxième possesseur constatait la même chose avec gpt-oss-20b et 120b, et trouvait LM Studio bien plus rapide. La réponse acceptée dit que l'image d'Ollama est lente, et un possesseur arrivé plus tard signale des performances normales après avoir réinstallé Ollama en natif plutôt que dans Docker.
- **Un GPU à 0 %.** Dans [« Models not using Spark GPU? »](https://forums.developer.nvidia.com/t/models-not-using-spark-gpu/354600), un possesseur qui avait installé Ollama et Open WebUI avec le playbook de NVIDIA voyait 0 % de GPU dans nvidia-smi et dans le DGX Dashboard, 100 % de CPU dans btop, et chaque modèle extrêmement lent. Les réponses recommandaient llama.cpp ou vLLM, et le fil ne consigne aucune cause.
- **Un partage silencieux avec le CPU.** Dans [« vLLM vs Ollama on the same model »](https://ai-muninn.com/en/blog/dgx-spark-vllm-vs-ollama-same-model), l'auteur a mesuré Gemma 4 26B-A4B à 52 tok/s sur vLLM avec NVFP4 et à 40 tok/s sur Ollama avec Q4_K_M. Un passage sur Ollama est revenu à 16 tok/s : `ollama ps` montrait le modèle à 66 % sur le CPU et à 34 % sur le GPU, et le décharger puis le recharger l'a ramené à 40.
- **Un modèle dense.** Dans [« DGX Spark performance »](https://forums.developer.nvidia.com/t/dgx-spark-performance/356716), un possesseur obtenait 9,46 tok/s de qwen3:32b dans Ollama et le comparait à un passage de gpt-oss:20b à 43,73. Les réponses ont souligné que qwen3:32b est dense, ses 32 milliards de paramètres tous actifs, alors que gpt-oss:20b est un mélange d'experts avec seulement 3,6 milliards de paramètres actifs par jeton.

## Pourquoi les modèles denses sont-ils lents sur un GB10 ?

Sur cette puce, le décodage d'un seul flux est limité par la bande passante mémoire : le GB10 annonce 273 Go/s, environ 225 Go/s sont mesurables, et chaque étape de décodage d'un modèle dense lit tous ses poids. [Le tableau Spark d'Ollama lui-même](https://ollama.com/blog/nvidia-spark-performance) montre le phénomène : qwen3 32B en q4_K_M décode à 9,411 tok/s, alors que les mélanges d'experts gpt-oss 20B et 120B, en MXFP4, atteignent 58,27 et 41,14, mesurés avec Ollama v0.12.6 sur le firmware 580.95.05 en octobre 2025.

Un moyen de dépasser cette limite sur un modèle dense est le décodage spéculatif : un modèle brouillon propose plusieurs jetons et le modèle les vérifie en une seule étape, si bien qu'une lecture des poids donne plus d'un jeton. C'est ainsi que la lane Qwen3.8 27B de ce projet, un modèle dense prêt à servir, atteint une médiane gloutonne de 65,2 à 68,5 tok/s sur ses sondes `./bench.sh`. Comparez aussi ce qui est comparable : sur la machine de référence, la prose libre tournait plus lentement que le code avec chaque moteur et chaque modèle brouillon essayés, environ 2 fois plus lentement avec un modèle brouillon par blocs.

## Que vérifier en premier ?

1. **Où tourne le modèle.** `ollama ps` l'indique dans sa colonne Processor, et l'article d'ai-muninn considère que tout ce qui est en dessous de 100 % GPU justifie de décharger puis de recharger le modèle.
2. **Comment Ollama est installé.** Des possesseurs signalent dans le fil 353456 que l'image Docker est lente, et l'un d'eux signale une vitesse normale après une installation native.
3. **De quel type de modèle il s'agit.** Un 32B dense et un mélange d'experts à 3,6 milliards de paramètres actifs sont des charges de travail différentes sur la même machine.
4. **Combien de requêtes vous envoyez à la fois.** Dans le fil 379766, le débit total d'Ollama à 8 requêtes simultanées restait à peu près à son chiffre sur un seul flux, et l'article d'ai-muninn indique qu'Ollama met les requêtes en file d'attente par défaut, sauf si l'on relève `OLLAMA_NUM_PARALLEL`.

## Comment Ollama se compare-t-il à vLLM sur le même Spark ?

Un possesseur a fait passer quatre modèles par les deux moteurs sur un même DGX Spark, avec un seul banc de mesure : prompt identique, 400 jetons au maximum, préchauffage écarté ([fil 379766](https://forums.developer.nvidia.com/t/measured-inference-benchmarks-on-a-single-dgx-spark-same-harness-across-ollama-llama-cpp-and-vllm-notes-data-published/379766), août 2026). Ollama faisait tourner des versions Q4 et vLLM des versions 4 bits, les formats diffèrent donc :

| Modèle (tok/s) | Ollama, requête seule | vLLM, requête seule | Ollama, 8 à la fois | vLLM, 8 à la fois |
|---|---|---|---|---|
| qwen3-coder-next | 59,2 | 74,8 | 60,4 | 289,0 |
| Gemma-4-26B-A4B (MTP sur vLLM) | 49,6 | 54,9 | 51,9 | 303,6 |
| GPT-OSS-120B | 42,1 | 60,7 | 42,5 | 116 à 153 |
| Qwen3-30B-A3B | 85,2 | 77,1 | 87,5 | 313,4 |

Ollama menait en requête seule sur Qwen3-30B-A3B, et vLLM sur les trois autres. À 8 requêtes simultanées, vLLM menait sur les quatre. Sans décodage spéculatif, la version NVFP4 de NVIDIA de ce Gemma tournait à 30,3 tok/s sur vLLM, en dessous de la Q4_K_M communautaire dans Ollama. Les réserves de l'auteur : une seule machine, un seul opérateur, un seul jeu de prompts, la vitesse seulement, et des chiffres en simultané qui ont varié de ±30 % d'un passage à l'autre.

## Qu'a mesuré ce projet à la place ?

Aucun des chiffres ci-dessus ne vient de ce projet. Il a mesuré llama.cpp, qui fait aussi tourner les fichiers GGUF, face à sa lane SGLang, sur le même Qwen3.8-27B, avec sa batterie figée (décodage glouton) :

| Charge de travail (tok/s) | llama.cpp UD-Q4_K_XL + MTP n=3, réglé | SGLang + DFlash2 (v1.2) |
|---|---|---|
| Code agentique (code, diffs, appels d'outils) | 25,6 | 32 à 40 |
| Raisonnement (FR) | 27,5 | 41 à 44 |
| Prose libre EN / FR / DE | 17,7 / 18,2 / 18,0 | 22 / 20 / 17 |

Ses lanes sur la machine de référence comprennent Qwen3.8 27B sur SGLang 0.5.22, à une médiane gloutonne de 65,2 à 68,5 tok/s et à 80,6 tok/s au total à 4 requêtes sur des prompts de 8 192 jetons, Nemotron 3.5 Bolt sur vLLM, à 140 tok/s en réécriture de code et à 201,2 tok/s au total sur 16 flux, et Kolibri-1 sur vLLM, à 48,0 tok/s avec un flux et à 202,0 avec 16. Ce sont d'autres modèles que ceux des possesseurs : ils montrent ce que livre chaque lane, pas ce que ferait Ollama avec les mêmes modèles.

## Faut-il quitter Ollama ?

Pas pour tout. Ollama est simple pour démarrer, et l'auteur d'ai-muninn le choisit encore pour un usage interactif rapide. Pour des agents, plusieurs utilisateurs ou de longues sessions, les tests de possesseurs ci-dessus et les lanes de ce projet désignent vLLM et SGLang, dont le débit a continué de croître avec les requêtes simultanées. L'installeur de ce projet installe les deux sur un Spark en une seule commande, avec des versions épinglées. Chaque chiffre ici est une mesure à un instant donné sur une seule machine, et vos tok/s varieront avec le modèle, le contenu et la langue.
