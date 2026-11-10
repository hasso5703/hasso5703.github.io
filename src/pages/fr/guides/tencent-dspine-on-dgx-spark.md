---
layout: ../../../layouts/Guide.astro
slug: tencent-dspine-on-dgx-spark
lang: fr
title: "Tencent DSpine sur DGX Spark : mesuré face à DFlash2"
description: "Le modèle brouillon DSpine de Tencent sur DGX Spark (GB10) : 60,4 tok/s contre 67,3 pour DFlash2 sur la même machine, et des jetons parasites en échantillonné."
h1: "Tencent DSpine vaut-il la peine sur un DGX Spark ?"
published: "2026-11-10"
answer: "Pas aujourd'hui. Sur un DGX Spark (GB10, 128 Go), le modèle brouillon DSpine de Tencent pour Qwen3.8-27B a mesuré <strong>60,4 tok/s</strong> sur des prompts courts en glouton, contre <strong>67,3</strong> pour le modèle brouillon DFlash2 qu'Alzeo sert sur la même machine (le passage du milieu sur trois, de chaque côté). Avec l'échantillonnage, 23 réponses sur 24 portaient des <code>!</code> parasites à la place de vrais jetons : sur ce matériel, c'est donc glouton seulement. Mesuré le 2026-11-09 sur une seule machine de référence."
faq:
  - q: "DSpine tourne-t-il sur un DGX Spark ?"
    a: "Oui, avec des modifications. Sur la machine de référence il a démarré avec l'attention de son brouillon sur Triton et trois petits correctifs du greffon, sous SGLang 0.5.22. Une pull request ouverte sur Tencent/DSpine suit la même voie."
  - q: "DSpine est-il plus rapide que DFlash2 sur un DGX Spark ?"
    a: "Non. Trois passages du même banc à prompts courts ont donné 57,5, 60,6 et 60,4 tok/s pour DSpine, contre 68,8, 66,8 et 67,3 pour Qwen3.8-27B avec son modèle brouillon DFlash2 en NVFP4. DSpine a tenu sur le code et perdu sur la prose et le JSON."
  - q: "Peut-on utiliser une température avec DSpine sur un GB10 ?"
    a: "Pas sans risque. Le débit et la longueur d'acceptation semblaient sains, mais 23 réponses échantillonnées sur 24 portaient des ! parasites, environ 100 sur 9 600 jetons, chacun à la place d'un ou de quelques vrais jetons. Les 8 réponses gloutonnes n'en portaient aucun, pas plus que 32 réponses de la lane DFlash2 sur les mêmes prompts."
  - q: "Pourquoi DSpine demande-t-il un autre checkpoint ?"
    a: "Il refuse une tête LM quantifiée : la cible était donc RadixArk/Qwen3.8-27B-NVFP4-BF16-LMHead. À la même fraction de mémoire, ce checkpoint a laissé un pool KV de 678 798 jetons, contre 907 852 pour la version à tête FP4."
  - q: "Un banc de débit aurait-il vu les jetons parasites ?"
    a: "Non. Les jetons par seconde et la longueur d'acceptation étaient normaux, et le texte continuait comme si le bon jeton était là. Seule la lecture des réponses générées l'a montré."
  - q: "Alzeo installe-t-il DSpine ?"
    a: "Non. Alzeo sert Qwen3.8-27B avec un modèle brouillon DFlash2, mesuré plus rapide sur ce matériel, et dont les réponses échantillonnées sont restées propres sur les mêmes prompts."
sources:
  - label: "Forum des développeurs NVIDIA, les mesures telles que postées"
    href: "https://forums.developer.nvidia.com/t/380257/122"
  - label: "Tencent/DSpine, pull request 4, les mêmes constats"
    href: "https://github.com/Tencent/DSpine/pull/4#issuecomment-6755399923"
related:
  - label: "Tous les guides"
    href: "/fr/guides/"
  - label: "Quel moteur d'inférence faire tourner sur un DGX Spark ?"
    href: "/fr/guides/sglang-vs-vllm-vs-llama-cpp-on-dgx-spark/"
  - label: "TensorFold est-il plus rapide que vLLM sur un DGX Spark ?"
    href: "/fr/guides/tensorfold-vs-vllm-on-dgx-spark/"
---

## Comment DSpine a-t-il été lancé sur un GB10 ?

DSpine est le modèle brouillon de Tencent pour le décodage spéculatif de Qwen3.8-27B : un petit modèle propose des jetons et le 27B les vérifie. Il a été lancé le 2026-11-09 sur la machine de référence, un ASUS Ascent GX10 (GB10, 128 Go), à côté de la lane qu'Alzeo sert tous les jours (une lane est un modèle prêt à servir).

| | Bras DSpine | Bras DFlash2 (ce qu'Alzeo sert) |
|---|---|---|
| Moteur | SGLang 0.5.22 | SGLang 0.5.22 |
| Cible | RadixArk/Qwen3.8-27B-NVFP4-BF16-LMHead | RadixArk/Qwen3.8-27B-NVFP4, tête FP4 |
| Modèle brouillon | tencent/Qwen3.8-27B-DSpine-b16, attention du brouillon sur Triton | DFlash2 en NVFP4, 16 jetons de brouillon |
| Fraction de mémoire | 0,76 | 0,76 |
| Pool KV | 678 798 jetons | 907 852 jetons |

Le greffon était Tencent/DSpine au commit `321b0fc`, avec trois correctifs : Triton accepté pour l'attention du brouillon, le contrôle du backend FlashAttention gardé pour `fa3` et `fa4` seulement, et ni le graphe irrégulier ni le contrôle « device-only » de `verification/sps.py` quand `batch8_tokens` vaut 128. Sans le dernier, une cible FlashInfer s'arrête au démarrage sur « FlashInfer does not support ragged verify in cuda graph ». Une pull request ouverte sur le projet prend la même route, avec Triton des deux côtés.

## Quelle vitesse pour DSpine face à DFlash2 ?

Plus lent sur cette machine. Le banc est le `./bench.sh` d'Alzeo : des prompts courts, en glouton, une requête à la fois, trois passages pour chaque bras.

| `./bench.sh`, médiane gloutonne (tok/s) | Trois passages | Passage du milieu |
|---|---|---|
| DSpine b16 | 57,5, 60,6, 60,4 | 60,4 |
| DFlash2 | 68,8, 66,8, 67,3 | 67,3 |

Une seconde sonde a envoyé quatre prompts (code, maths, prose, JSON) de 400 jetons avec la réflexion activée, deux passages chacun. Médiane en tok/s, avec la longueur d'acceptation moyenne entre parenthèses. La lane DFlash2 a été mesurée sur deux démarrages, et les deux sont montrés parce qu'ils diffèrent :

| Réglage | DSpine b16 | DFlash2, deux démarrages |
|---|---|---|
| Glouton | 37,0 (3,82) | 41,3 (3,85) et 46,7 (3,96) |
| T=1.0, top_k 20, top_p 0.95 | 31,9 (3,58) | 34,7 (3,70) et 42,2 (3,92) |
| T=0.6, top_k 20, top_p 0.95 | 33,5 (3,72) | 41,2 (3,66) et 42,9 (3,84) |
| Aucun réglage d'échantillonnage envoyé | 29,9 (3,51) | 34,6 (3,55) et 41,3 (3,86) |

Par prompt, en glouton : DSpine a donné 51,0 tok/s sur le code, là où la lane DFlash2 a donné 47,2 et 60,4 sur ses deux démarrages. Sur la prose il a donné 17,7 contre 23,1 et 22,3, et sur le JSON 27,4 contre 35,1 et 34,0.

## Qu'est-ce qui ne va pas avec l'échantillonnage ?

Un possesseur a rapporté sur le forum NVIDIA que les requêtes échantillonnées s'effondrent sur un Spark quand l'attention du brouillon tourne sur `fa4` : une longueur d'acceptation de 1 et `!!!!` comme réponse. Avec l'attention du brouillon sur Triton, cet effondrement a disparu. Le débit et la longueur d'acceptation semblent sains, comme le montre le tableau ci-dessus.

Les réponses ne sont pas propres pour autant. Lues une par une, 23 des 24 réponses échantillonnées portent des `!` parasites : 37 dans les 8 réponses à T=1.0, 29 à T=0.6 et 33 sans réglage d'échantillonnage envoyé. Cela fait 99 sur environ 9 600 jetons échantillonnés. Les 8 réponses gloutonnes n'en portent aucun, pas plus que les 32 réponses de la lane DFlash2 sur les mêmes prompts et les mêmes réglages.

Chacun se tient à la place d'un ou de quelques vrais jetons, et le texte continue comme s'ils étaient là :

```
for start, end in sorted_intervals[1!]:
"The Cartographer's Debt!": "Elena Vasquez"
```

La première ligne devrait se lire `[1:]`. Dans la seconde, il manque une virgule et la clé `"author"`. `!` est le jeton d'identifiant 0 dans le tokenizer de Qwen3.8 : cela ressemble donc à un emplacement de sortie resté à zéro, pas à un jeton que le modèle aurait échantillonné. La cause n'a pas été trouvée. Le chemin rapide de DSpine pour les requêtes échantillonnées est écrit pour un H100 (`sampling/target.py` sort aussitôt s'il ne trouve pas 132 SM en `sm_90`), donc un GB10 prend le chemin générique.

Le résultat : du code qui ne tourne pas et du JSON qui ne se lit pas, sous un banc qui dit que tout va bien. Les jetons par seconde et la longueur d'acceptation ne peuvent pas voir ce genre de défaut. Gardez les générations et lisez-les, ou comparez-les à un passage de référence.

## Que coûte-t-il d'autre ?

- **Pool KV.** DSpine refuse une tête LM quantifiée. Le checkpoint à tête BF16 qu'il lui faut a laissé 678 798 jetons de pool KV à la même fraction de mémoire, contre 907 852.
- **Chaleur.** À 46 à 49 W sur le GPU, une requête à la fois, la médiane de la zone la plus chaude du SoC était de 91,4 °C sous DSpine contre 84,4 °C sous DFlash2 sur le banc, 91,9 contre 85,8 sur la sonde d'échantillonnage, et 92,8 contre 90,8 sur une sonde du cache de préfixe. Les passages de DFlash2 ont eu lieu 10 à 90 minutes plus tôt le même soir : une partie de l'écart peut donc venir de la chaleur déjà dans la machine.
- **La répétabilité** était proche : deux passages gloutons à froid ont donné les mêmes 48 jetons sur 14 documents de 16, contre 15 de 16 pour DFlash2.

## Qu'est-ce qui n'a pas été mesuré ?

La campagne s'est arrêtée quand la machine s'est éteinte à 96,4 °C, après quatre heures de campagnes l'une après l'autre. Les vrais agents de code par le proxy, 8 requêtes simultanées, les longues générations et les prompts au-delà de la fenêtre de 262K du checkpoint à tête BF16 n'ont pas été mesurés. Rien ici ne dit comment DSpine se comporte sur un H100, le matériel pour lequel son chemin rapide est écrit.

## Faut-il le lancer ?

Sur un DGX Spark aujourd'hui : glouton seulement, et il est plus lent qu'un modèle brouillon DFlash2 avec une tête FP4. Si vous l'essayez quand même, envoyez une température de 0, lisez les réponses et surveillez les zones thermiques ACPI, qui lisent plus haut que `nvidia-smi` sur cette machine (88 °C sur le GPU quand une zone du SoC lisait 96,4 °C).
