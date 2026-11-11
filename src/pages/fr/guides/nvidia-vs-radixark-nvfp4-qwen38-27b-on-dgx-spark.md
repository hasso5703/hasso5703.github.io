---
layout: ../../../layouts/Guide.astro
slug: nvidia-vs-radixark-nvfp4-qwen38-27b-on-dgx-spark
lang: fr
title: "NVFP4 de Qwen3.8-27B sur DGX Spark : NVIDIA contre RadixArk"
description: "Deux NVFP4 de Qwen3.8-27B sur un DGX Spark, même moteur et mêmes réglages : même vitesse, même mémoire, MMLU 437 contre 446 sur 500. Aucun n'est meilleur."
h1: "Quel NVFP4 de Qwen3.8-27B faire tourner sur un DGX Spark ?"
published: "2026-11-11"
answer: "L'un ou l'autre : sur la même machine, avec le même moteur et les mêmes réglages, les deux se valent. Celui de NVIDIA a décodé seul à 66,4 et 69,6 tok/s contre 64,8 et 69,1 pour celui de RadixArk, a laissé la même mémoire libre et le même pool KV, et a obtenu 246, 437 et 156 contre 248, 446 et 157 sur GSM8K, MMLU et HumanEval, des écarts qu'un seul passage ne distingue pas du bruit. Celui de NVIDIA est <strong>un peu plus proche de la référence FP8</strong> jeton par jeton (7 % de divergence en moins), ce que les bancs ne montrent pas. Alzeo garde celui de RadixArk, que sa lane 27B sert déjà."
faq:
  - q: "Le NVFP4 de Qwen3.8-27B de NVIDIA est-il meilleur que celui de RadixArk sur un DGX Spark ?"
    a: "Pas sur cet essai. Sur GSM8K, MMLU et HumanEval il a obtenu 246, 437 et 156 contre 248, 446 et 157, à la même vitesse et avec la même mémoire. Aucun banc ne sépare les deux à lui seul (p de McNemar = 0,50, 0,09 et 1,00)."
  - q: "Lequel est le plus rapide ?"
    a: "Aucun. Seul, la médiane gloutonne a été de 66,4 et 69,6 tok/s sur deux chargements du checkpoint de NVIDIA contre 64,8 et 69,1 pour celui de RadixArk. Avec quatre prompts envoyés ensemble, 56,6 et 53,8 contre 54,4 et 55,1. L'écart entre deux chargements d'un même checkpoint est aussi grand que l'écart entre les deux."
  - q: "Lequel est le plus proche du modèle FP8 ?"
    a: "Celui de NVIDIA, de peu. Sur 30 textes fixes, sa divergence moyenne par rapport au checkpoint FP8 de Qwen a été de 0,0638 contre 0,0688, soit 7 % de moins, et son premier choix a été celui du FP8 sur 90,2 % des positions contre 89,3 %."
  - q: "Les deux prennent-ils la même mémoire ?"
    a: "Oui, dès que les deux déclarent un cache KV en FP8. Le pool KV a tenu 873 248 et 881 931 jetons avec le checkpoint de NVIDIA contre 882 224 et 896 305 avec celui de RadixArk, 1 à 2 % de moins, ce qui est aussi ce dont le pool a bougé entre deux chargements d'un même checkpoint. Les deux ont été prêts en 220 s environ."
  - q: "Qu'est-ce qui diffère dans les fichiers de NVIDIA ?"
    a: "Tels que publiés, ils ne déclarent pas le cache KV en FP8 que ceux de RadixArk déclarent. Servis tels quels sous SGLang, ils reçoivent un cache en BF16, deux fois plus d'octets par jeton pour le cache du modèle lui-même. Pour cette comparaison, le checkpoint de NVIDIA a reçu la même déclaration."
  - q: "Lequel Alzeo installe-t-il ?"
    a: "RadixArk/Qwen3.8-27B-NVFP4, comme avant. La règle était de ne changer que si le checkpoint de NVIDIA mesurait mieux, et ce n'est pas le cas."
sources:
  - label: "nvidia/Qwen3.8-27B-NVFP4 sur Hugging Face"
    href: "https://huggingface.co/nvidia/Qwen3.8-27B-NVFP4"
  - label: "RadixArk/Qwen3.8-27B-NVFP4 sur Hugging Face"
    href: "https://huggingface.co/RadixArk/Qwen3.8-27B-NVFP4"
  - label: "docs/gb10-memory.md, comment la lane 27B partage la mémoire de la machine"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/gb10-memory.md"
related:
  - label: "Tous les guides"
    href: "/fr/guides/"
  - label: "TensorFold est-il plus rapide que vLLM sur un DGX Spark ?"
    href: "/fr/guides/tensorfold-vs-vllm-on-dgx-spark/"
  - label: "Quel moteur d'inférence faire tourner sur un DGX Spark ?"
    href: "/fr/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/"
---

## Qu'est-ce qui a été comparé ?

Deux quantifications NVFP4 du même modèle, sur la machine de référence (un ASUS Ascent GX10, GB10, 128 Go), en une nuit : le 2026-11-11, de 00:27 à 03:24.

| Bras | Checkpoint | Rôle |
|---|---|---|
| A | `RadixArk/Qwen3.8-27B-NVFP4` à la révision `52d1adc` | celui que sert la lane 27B d'Alzeo |
| B | `nvidia/Qwen3.8-27B-NVFP4` à la révision `482ca0f` | le candidat |
| C | `Qwen/Qwen3.8-27B-FP8` à la révision `017b9c7` | la référence, pour les probabilités des jetons seulement |

Chaque bras a tourné dans l'image SGLang de la lane 27B d'Alzeo, avec la ligne de commande de la lane et son modèle brouillon (décodage spéculatif). L'ordre a été A, B, C, B, A, chacun après un nouveau démarrage du moteur, pour qu'une dérive de la machine au fil de la nuit ne favorise aucun bras. La machine a été laissée refroidir sous 60 °C avant chaque chargement et chaque banc.

Deux choses ont d'abord été rendues égales, parce que les deux dépôts ne livrent pas le même `config.json` :

- **La fenêtre de 1M.** Alzeo sert la 27B avec YaRN et une fenêtre de 1 010 000 jetons. Le `config.json` de NVIDIA a reçu les quatre mêmes clés que celui de RadixArk, sur une copie.
- **Le cache KV.** Les fichiers de RadixArk déclarent un cache KV en FP8, ceux de NVIDIA non. Servi tel que publié, le checkpoint de NVIDIA reçoit un cache en BF16 : deux fois plus d'octets par jeton pour le cache du modèle lui-même, et d'après la taille des caches un pool d'environ 0,62 fois l'autre (une estimation, non mesurée ici). Pour cette comparaison, il a reçu la même déclaration.

Un contrôle du banc lui-même : le bras A a redonné les probabilités des jetons relevées sur la 27B de production le 2026-11-02 (aucun écart sur les 30 690 positions).

## Que disent les chiffres ?

| | A : RadixArk | B : NVIDIA |
|---|---|---|
| Prêt après un chargement (deux chargements) | 220 s, 220 s | 223 s, 220 s |
| Pool KV (deux chargements) | 882 224 et 896 305 jetons | 873 248 et 881 931 jetons |
| MemAvailable au plus bas en service (deux chargements) | 18,0 et 20,8 Gio | 19,0 et 21,6 Gio |
| 1 flux, glouton, médiane du code et du raisonnement (deux chargements) | 64,8 et 69,1 tok/s | 66,4 et 69,6 tok/s |
| Quatre prompts envoyés ensemble, médiane des flux de code et de raisonnement (deux chargements) | 54,4 et 55,1 tok/s | 56,6 et 53,8 tok/s |
| Longueur d'acceptation du brouillon, 1 flux (deux chargements) | 3,99 et 3,85 | 4,10 et 4,03 |
| GSM8K, 250 problèmes | 248 justes (0,992) | 246 justes (0,984) |
| MMLU, 500 questions | 446 justes (0,892) | 437 justes (0,874) |
| HumanEval, 164 problèmes | 157 justes (0,957) | 156 justes (0,951) |
| Une phrase secrète cachée à 120 000 et à 300 000 jetons | 2 retrouvées sur 2 | 2 retrouvées sur 2 |
| 32 réponses échantillonnées, quatre réglages d'échantillonnage | 0 avec un défaut | 0 avec un défaut |
| Jetons de réflexion sur 20 prompts, effort par défaut | 2 530 | 2 239 |

La vitesse, la mémoire et le pool sont les mêmes. Quand deux chargements d'un même checkpoint diffèrent de 4 tok/s, un écart de 2 entre les checkpoints ne dit rien.

## L'écart sur MMLU est-il réel ?

Neuf questions sur 500, c'est le plus grand écart de la nuit, et il ne suffit pas pour conclure. Question par question :

| Banc | Justes des deux | A seul juste | B seul juste | Aucun | McNemar, p exact |
|---|---|---|---|---|---|
| GSM8K | 246 | 2 | 0 | 2 | 0,50 |
| MMLU | 430 | 16 | 7 | 47 | 0,09 |
| HumanEval | 154 | 3 | 2 | 5 | 1,00 |

Aucun banc ne sépare les deux checkpoints à lui seul. Mis ensemble après coup, les trois donnent 21 questions à A seul contre 9 à B seul (p = 0,04) : un indice en faveur du checkpoint de RadixArk, pas une preuve. Chaque banc a tourné une fois par checkpoint, et la part des questions qui changent entre deux passages du même checkpoint n'a pas été mesurée.

## Lequel est le plus proche du modèle FP8 ?

Celui de NVIDIA, de peu. Chaque bras a noté les mêmes 30 textes fixes de 1 024 jetons, et le bras C, le checkpoint FP8 de Qwen, sert de référence :

| Par rapport au FP8 | A : RadixArk | B : NVIDIA |
|---|---|---|
| Log-vraisemblance négative moyenne (FP8 : 1,7774) | 1,7864 | 1,7822 |
| Divergence moyenne par rapport au FP8 (KL, top 20) | 0,0688 | 0,0638 |
| Même premier choix que le FP8 | 89,3 % | 90,2 % |

Soit 7 % de divergence en moins pour le checkpoint de NVIDIA. C'est la seule mesure où il mène, et elle ne se voit pas dans les réponses : les trois bancs penchent de l'autre côté.

## Qu'est-ce que cela ne montre pas ?

- Un seul passage de chaque banc par checkpoint. Un second passage pourrait déplacer MMLU dans un sens ou dans l'autre.
- Aucun banc d'agent ou d'appel d'outils, et pas de vision.
- Une machine, un moteur : SGLang avec un modèle brouillon. Sous un autre moteur, les deux checkpoints peuvent différer par ce qu'ils demandent (la déclaration du cache KV ci-dessus en est un exemple).

## Qu'en fait Alzeo ?

Rien ne change. La règle fixée avant l'essai était : le checkpoint de NVIDIA devient le défaut de la lane s'il mesure mieux. Ce n'est pas le cas, la lane 27B garde donc `RadixArk/Qwen3.8-27B-NVFP4`. Si vous servez déjà l'un des deux, rien ici ne justifie de télécharger l'autre. Une nouvelle révision de l'un des deux dépôts rouvre la question.
