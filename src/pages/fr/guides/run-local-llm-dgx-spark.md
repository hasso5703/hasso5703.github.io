---
layout: ../../../layouts/Guide.astro
slug: run-local-llm-dgx-spark
lang: fr
title: "Faire tourner un LLM local sur DGX Spark : quatre façons mesurées"
description: "Ollama, les playbooks NVIDIA, un moteur à régler ou un installeur en une commande : ce que chacun exige sur DGX Spark, et les vitesses mesurées."
h1: "Comment faire tourner un LLM local sur un DGX Spark"
published: "2026-10-26"
rank: 1
answer: "Quatre façons, de la plus rapide à mettre en route à la plus rapide à l'usage : Ollama, les playbooks de NVIDIA, un moteur que vous réglez vous-même, ou un installeur qui l'épingle et le règle pour vous. La vitesse dépend moins du moteur que de la quantification, du modèle brouillon et des réglages mémoire : sans décodage spéculatif, un 32B dense lit tous ses poids à chaque jeton (le tableau d'Ollama lui-même : 9,411 tok/s pour qwen3 32B), alors que ce projet mesure Qwen3.8 27B entre <strong>65,2 et 68,5 tok/s</strong> avec NVFP4 et un modèle brouillon DFlash2."
faq:
  - q: "Quelle est la façon la plus simple de faire tourner un LLM sur un DGX Spark ?"
    a: "Ollama : une installation, un modèle appelé par son nom, et les playbooks de NVIDIA s'en servent pour Open WebUI et pour un agent de code. Dans le test d'un possesseur, avec le même banc de mesure pour chaque moteur, il était plus lent que vLLM en requête seule sur trois modèles sur quatre, et à 8 requêtes simultanées son débit total restait à peu près à son chiffre sur un seul flux."
  - q: "Un DGX Spark est-il assez rapide pour des LLM locaux ?"
    a: "Cela dépend de la configuration plus que de la puce. Un modèle dense en 4 bits sans décodage spéculatif est limité par la bande passante mémoire (9,411 tok/s pour qwen3 32B dans le tableau d'Ollama). Avec NVFP4 et un modèle brouillon, ce projet mesure Qwen3.8 27B entre 65,2 et 68,5 tok/s (médiane gloutonne), et les mélanges d'experts vont plus loin : Nemotron 3.5 Bolt à 140 tok/s en réécriture de code."
  - q: "Quel moteur est le plus rapide sur un DGX Spark ?"
    a: "Aucun sur toutes les tâches. Sur le même Qwen3.8-27B, SGLang avec un modèle brouillon par blocs menait sur le code, et de simples têtes MTP tenaient mieux sur la prose libre. Ce que vous générez et le modèle brouillon comptent plus que le moteur."
  - q: "Un DGX Spark peut-il faire tourner plusieurs modèles à la fois ?"
    a: "Ils partagent un seul pool de mémoire unifiée avec le système d'exploitation. Cet installeur sert une lane à la fois et garde les autres sur disque, à un clic sur Load, avec la voix à côté de n'importe quelle lane, sur le CPU. Deux moteurs à la fois, c'est possible sur votre propre configuration si leurs réglages mémoire laissent de la place, et le piège mémoire du GB10 s'applique."
  - q: "NVIDIA a-t-elle son propre lanceur ?"
    a: "NVIDIA a annoncé NVIDIA Sync Model Launcher le 2026-10-02 pour la fin octobre : il télécharge et lance Qwen3.8 27B sur un DGX Spark ou un cluster, le rend accessible depuis un ordinateur portable, et configure OpenCode dans le navigateur."
sources:
  - label: "Blog d'Ollama : performances du NVIDIA DGX Spark"
    href: "https://ollama.com/blog/nvidia-spark-performance"
  - label: "Forum NVIDIA : le même banc de mesure pour Ollama, llama.cpp et vLLM"
    href: "https://forums.developer.nvidia.com/t/measured-inference-benchmarks-on-a-single-dgx-spark-same-harness-across-ollama-llama-cpp-and-vllm-notes-data-published/379766"
  - label: "Les playbooks DGX Spark de NVIDIA"
    href: "https://build.nvidia.com/spark"
  - label: "Blog NVIDIA, 2026-10-02 : DGX Spark de 64 Go et NVIDIA Sync"
    href: "https://blogs.nvidia.com/blog/local-ai-dgx-spark-64gb-sync/"
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/BENCHMARKS.md"
  - label: "README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md"
related:
  - label: "Quel moteur d'inférence faire tourner sur un DGX Spark ?"
    href: "/fr/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/"
  - label: "Pourquoi Ollama est-il lent sur mon DGX Spark ?"
    href: "/fr/guides/ollama-slow-on-dgx-spark/"
  - label: "Pourquoi mon DGX Spark se fige-t-il au chargement d'un modèle ?"
    href: "/fr/guides/dgx-spark-freezes-when-loading-a-model/"
---

## Quelles sont les façons de faire ?

| Façon | Ce que vous obtenez | Ce qu'elle vous demande |
|---|---|---|
| Ollama | Le démarrage le plus rapide : une installation, des modèles appelés par leur nom | Dans le test d'un possesseur, plus lent que vLLM sur trois modèles sur quatre, et un débit qui ne monte pas avec les requêtes simultanées |
| Les playbooks de NVIDIA | Des guides officiels pas à pas sur build.nvidia.com/spark pour Open WebUI, vLLM, SGLang, llama.cpp, LM Studio, NIM et un agent de code | Un moteur et un modèle par guide. Les réglages mémoire, les modèles brouillons et les mises à jour sont à votre charge |
| Un moteur que vous réglez | La meilleure vitesse pour un modèle, quand la quantification, le modèle brouillon et la fraction de mémoire sont justes | Le piège mémoire du GB10, et les épinglages et mises à jour à suivre |
| Cet installeur | Neuf lanes mesurées (des modèles prêts à servir), épinglées et prouvées, les API OpenAI et Anthropic, un cockpit, en une seule commande | Une seule lane sert à la fois, sur NVIDIA DGX OS et une machine GB10 |

## Qu'est-ce qui décide de la vitesse ?

Sur un GB10, le décodage d'un seul flux est limité par la bande passante mémoire : la puce annonce 273 Go/s, environ 225 Go/s sont mesurables, et chaque étape de décodage d'un modèle dense lit tous ses poids. Deux leviers font bouger le résultat : les octets que lit chaque étape (la quantification) et les jetons que chaque étape accepte (le décodage spéculatif, où un modèle brouillon propose des jetons que le modèle vérifie, si bien que la sortie ne change pas).

Voilà pourquoi la même machine donne des chiffres si différents. [Le tableau Spark d'Ollama lui-même](https://ollama.com/blog/nvidia-spark-performance) donne le qwen3 32B dense à 9,411 tok/s en q4_K_M, contre 58,27 pour le mélange d'experts gpt-oss 20B. Avec des poids NVFP4 et un modèle brouillon DFlash2 calibré, ce projet mesure Qwen3.8 27B à une médiane gloutonne de 65,2 à 68,5 tok/s sur `./bench.sh` (deux passages, 2026-11-05).

## Comment les moteurs se comparent-ils sur le même modèle ?

Sur la machine de référence, un ASUS Ascent GX10, le dépôt a fait passer Qwen3.8-27B par trois moteurs le même jour, en août 2026 : environ 34 tok/s sur SGLang avec NVFP4 et le modèle brouillon DSpark, environ 27 sur llama.cpp réglé avec MTP, et environ 24,5 avec la recette NVFP4 officielle de vLLM 0.27, sur du code et des maths avec des prompts en français. Sur sa batterie figée, llama.cpp réglé a mesuré 25,6 tok/s en code agentique, contre 32 à 40 pour SGLang avec le modèle brouillon DFlash2 v1.2. [Le guide des moteurs](/fr/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/) donne tous les tableaux.

Ollama ne faisait pas partie des passages du dépôt. Dans [le test d'un possesseur, avec le même banc de mesure pour chaque moteur](https://forums.developer.nvidia.com/t/measured-inference-benchmarks-on-a-single-dgx-spark-same-harness-across-ollama-llama-cpp-and-vllm-notes-data-published/379766), vLLM était plus rapide en requête seule sur trois modèles sur quatre (60,7 contre 42,1 tok/s sur GPT-OSS-120B), Ollama sur le quatrième (85,2 contre 77,1 sur Qwen3-30B-A3B), et à 8 requêtes simultanées vLLM menait sur les quatre.

## Qu'est-ce qui peut mal tourner avec votre propre configuration ?

La mémoire. Un GB10 n'a pas de mémoire vidéo séparée : ce qu'alloue le GPU vient du même pool que celui où tourne le système d'exploitation. Le décompte de SGLang n'y voit pas 25 à 40 Go d'allocations transitoires, et un pool poussé à zéro fige la machine jusqu'à un redémarrage électrique. [Le guide sur les gels au chargement](/fr/guides/dgx-spark-freezes-when-loading-a-model/) dit quels réglages sont sûrs, et pourquoi.

## Que fait cet installeur de différent ?

Il installe neuf lanes, chacune épinglée (les images de moteur par leur empreinte, les checkpoints par leur révision) et mesurée sur la machine de référence, et les fait se relayer dans la mémoire unifiée : chargez-en une depuis le cockpit, elle sert pendant que les autres attendent sur disque. Chaque lane répond à travers un proxy keepalive qui parle les API OpenAI et Anthropic, si bien que Claude Code, opencode et les SDK pointent vers la machine au lieu d'un cloud.

| Lane | Mesuré |
|---|---|
| Qwen3.8 27B NVFP4 · RadixArk, avec un modèle brouillon DFlash2, sur SGLang 0.5.22 | 65,2 à 68,5 tok/s, médiane gloutonne sur deux passages, une requête, avec une fenêtre de 1M de jetons |
| Nemotron 3.5 Bolt, avec son modèle brouillon, sur vLLM | 140 tok/s en réécriture de code, une requête, raisonnement désactivé |
| Qwen3.8 Flash-Next (176B), sur SGLang nightly 53295c6 | 47,9 tok/s sur du code, avec FLASH_TIER=context |

[Les neuf lanes, avec leurs méthodes](/fr/models/).

## Et le lanceur de NVIDIA ?

NVIDIA [a annoncé NVIDIA Sync Model Launcher](https://blogs.nvidia.com/blog/local-ai-dgx-spark-64gb-sync/) le 2026-10-02, pour la fin octobre : il télécharge et lance Qwen3.8 27B sur un DGX Spark ou un cluster, le rend accessible depuis un ordinateur portable, et configure OpenCode dans le navigateur. Il n'était pas encore sorti quand ce guide a été écrit.

## Laquelle choisir ?

- **Pour essayer un modèle en cinq minutes :** Ollama.
- **Pour apprendre un moteur pas à pas :** le playbook de NVIDIA consacré à ce moteur.
- **Pour tirer le maximum d'un modèle et l'entretenir vous-même :** réglez le moteur, en partant du [guide des moteurs](/fr/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/) et du [guide sur les gels au chargement](/fr/guides/dgx-spark-freezes-when-loading-a-model/).
- **Pour servir des agents et des applications tous les jours sur des réglages mesurés :** cet installeur.
