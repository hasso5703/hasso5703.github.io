---
layout: ../../../layouts/Guide.astro
slug: dgx-spark-freezes-when-loading-a-model
lang: fr
title: "DGX Spark figé au chargement d'un modèle : la mémoire unifiée"
description: "Sur DGX Spark, SGLang ne voit pas 25 à 40 Go d'allocations transitoires, et un pool poussé à zéro le fige. Pourquoi, comment le voir venir et comment l'éviter."
h1: "Pourquoi mon DGX Spark se fige-t-il au chargement d'un modèle ?"
published: "2026-10-26"
answer: "Sur un GB10, la comptabilité mémoire de SGLang ne voit pas <strong>25 à 40 Go</strong> d'allocations transitoires (l'autotuner fp8 de flashinfer et la capture des graphes CUDA) : une fraction mémoire réglée trop haut peut donc faire tomber à zéro la mémoire disponible de l'hôte et emporter SSH avec elle, jusqu'à un redémarrage électrique. L'installeur épingle la 27B à <strong>0,76</strong> dans son mode 1M par défaut, avec l'autotuner désactivé (à 0,80, un plantage a été mesuré sous 3 requêtes simultanées), ce qui laisse <strong>21,30 Gio</strong> de marge côté GPU après la capture des graphes, et il ajoute une garde de démarrage et un plancher mémoire de 3 Gio."
faq:
  - q: "Pourquoi SSH cesse-t-il de répondre sur mon DGX Spark pendant qu'un modèle se charge ?"
    a: "Sur un GB10, le GPU et le système partagent un seul pool de mémoire. Quand les allocations non suivies d'un moteur font tomber à zéro la mémoire disponible de l'hôte, le démon SSH n'a plus rien non plus, et seul un redémarrage électrique ramène la machine."
  - q: "Le réglage --mem-fraction-static 0.80 est-il sans danger sur un DGX Spark ?"
    a: "Pour un seul flux sur une machine dédiée, le 0,80 du cookbook SGLang est bien étayé : 48 configurations avec une concurrence de 1. Pour plusieurs clients, il ne l'est pas : à 0,80, un plantage a été mesuré sur la 27B sous 3 requêtes simultanées, avec 2 Gio libres."
  - q: "L'option docker --memory empêche-t-elle un DGX Spark de manquer de mémoire ?"
    a: "Non. Elle borne la mémoire RSS de l'hôte, mais le cgroup ne voit pas les allocations unifiées de CUDA : à la fraction 0,76, le conteneur occupait 7,15 Gio de ses 100 Gio pendant que le moteur générait. La fraction mémoire est la vraie garde."
  - q: "Les lignes NVRM NV_ERR_NO_MEMORY du journal du noyau annoncent-elles un gel à venir ?"
    a: "Pas à elles seules. La machine de référence en a journalisé 4 286 en trois semaines, dont deux tiers pendant des démarrages ordinaires du moteur, et les allocations du moteur lui-même réussissent toujours. Le MemAvailable de l'hôte est le chiffre à surveiller."
  - q: "Que fait le plancher mémoire du cockpit ?"
    a: "Quand le MemAvailable de l'hôte passe sous 3 Gio alors que des requêtes s'exécutent, le cockpit interrompt toutes les générations en cours, jamais deux fois en 60 s et jamais quand rien ne tourne. COCKPIT_MEM_FLOOR_GIB fixe le seuil."
  - q: "Pourquoi mon moteur attend-il au lieu de démarrer après un plantage ?"
    a: "La garde de démarrage le retient tant que ce qui reste d'un moteur occupe plus de 2 Gio de mémoire GPU, ou que le pilote garde plus de 16 Gio qui ne sont attribués à aucun processus. systemd réessaie toutes les 15 s, et la lane démarre d'elle-même une fois la mémoire revenue."
sources:
  - label: "README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md"
  - label: "docs/gb10-memory.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/gb10-memory.md"
  - label: "docs/engine-restarts.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/engine-restarts.md"
  - label: "docs/cockpit.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/cockpit.md"
  - label: "docs/flash-local-lane.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/flash-local-lane.md"
  - label: "docs/flash-lane.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/flash-lane.md"
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/BENCHMARKS.md"
  - label: "dashboard/cockpit.py"
    href: "https://github.com/hasso5703/alzeo/blob/main/dashboard/cockpit.py"
  - label: "dashboard/lifecycle.py"
    href: "https://github.com/hasso5703/alzeo/blob/main/dashboard/lifecycle.py"
related:
  - label: "Que faire tourner sur un DGX Spark de 64 Go"
    href: "/fr/dgx-spark-64gb/"
  - label: "Toutes les machines GB10"
    href: "/fr/machines/"
  - label: "Tous les guides"
    href: "/fr/guides/"
---

## Qu'est-ce que le piège de la mémoire unifiée du GB10 ?

Un GB10 n'a pas de mémoire vidéo séparée. Ce que prend une allocation GPU, c'est la mémoire de la machine elle-même, le même pool de 128 Go dans lequel tournent le système d'exploitation et SSH. SGLang dimensionne son pool statique avec `--mem-fraction-static`, mais sur GB10 sa comptabilité mémoire ne voit pas 25 à 40 Go d'allocations transitoires : l'autotuner fp8 de flashinfer et la capture des graphes CUDA allouent hors du pool suivi.

Réglez la fraction trop haut, ou lancez SGLang en natif hors de Docker, et la mémoire disponible de l'hôte peut tomber à zéro. Sur un système où SSH repose sur cette même mémoire, la machine ne répond plus, et seul un redémarrage électrique la ramène.

C'est au chargement que le projet l'a pris sur le fait : la capture des graphes CUDA est une étape du démarrage, le cache de l'allocateur d'une lane vLLM (une lane est un modèle prêt à servir) a mené la machine au bord de la mémoire pendant qu'elle préparait ses poids, et un moteur peut démarrer par-dessus une mémoire qu'un moteur mort occupe encore. Chaque cas figure ci-dessous, avec ce que l'installeur fait pour y répondre.

## L'option docker --memory empêche-t-elle un DGX Spark de manquer de mémoire ?

Non. Sur une machine de 128 Go, les unités de la 27B plafonnent le conteneur du moteur avec `--memory 100g --memory-swap 100g` : un emballement tue donc le conteneur, jamais l'hôte. Mais le cgroup ne voit pas les allocations unifiées de CUDA. Mesuré à la fraction 0,76 pendant une génération de 5 623 jetons, le conteneur a occupé 7,15 Gio de ses 100 Gio du début à la fin. `docker stats` et la mémoire RSS du processus paraissent calmes pendant que le pool s'épuise. La fraction est la vraie garde.

## Quelle valeur de --mem-fraction-static est sans danger sur un DGX Spark ?

Pour la 27B sous SGLang, les unités installées l'épinglent pour vous :

- **0,76** en mode 1m, le mode par défaut depuis la v1.12.1, avec l'autotuner désactivé
- **0,50** en mode natif et sous `./run.sh`
- **À 0,80, un plantage a été mesuré** sous 3 requêtes simultanées (2 Gio libres, Triton `CUDA operation not permitted`). Sur la 27B, considérez tout ce qui dépasse 0,80 comme le territoire du livelock.

La valeur épinglée est passée de 0,70 à 0,76 parce que l'image a changé : sur l'image de la version officielle, 0,70 coûtait 15 % du pool KV (770 118 jetons contre 906 524) et laissait 10 Go de mémoire GPU inutilisés. À 0,76, la marge côté GPU après la capture des graphes est de 21,30 Gio, contre 19,38 Gio pour l'ancienne valeur épinglée, 0,70 sur l'image précédente. Cette marge est le chiffre à surveiller.

Le 0,80 du cookbook SGLang pour la 27B sur DGX Spark n'est pas une contradiction. Ses cellules GB10 ont exécuté 48 configurations à ISL 8 192 / OSL 1 024 avec une concurrence de 1, en démarrage et service seulement. Il rejette 0,85 parce que 0,85 de 128 Go laisse environ 8 Go au système, exactement le seuil SIGTERM de l'earlyoom de DGX OS, et 15 cellules sur 48 y ont été tuées. Pour un seul flux sur une machine dédiée, le 0,80 du cookbook est la valeur épinglée la mieux étayée. L'installeur optimise pour plusieurs clients à la fois.

Les autres lanes portent leurs propres valeurs mesurées : la lane flash tourne à 0,85 sous un plafond de 110g, la valeur des cellules Flash-Next à un seul Spark du cookbook SGLang, et les lanes vLLM règlent `--gpu-memory-utilization` (Kolibri 0,80 ou 0,55, Bolt 0,70, Super VL 0,75, Qwen3.8 Flash-Next FP4-Local 0,80).

## Pourquoi un DGX Spark se fige-t-il après le plantage ou le redémarrage d'un moteur ?

Un moteur qui se charge a d'abord besoin que la mémoire du précédent soit rendue. Lors d'un test de plantage de la lane 27B le 2026-10-01, les 92 Go qu'occupait le moteur sont revenus en 2 à 5 s. Dans sglang#40948, ce ne fut pas le cas : le pilote a gardé la mémoire d'un moteur mort, le démarrage suivant a empilé ses allocations par-dessus, et un DGX Spark s'est figé pendant 9,5 h.

Chaque unité de moteur exécute une garde de démarrage, `engine-preflight.sh`, avant son moteur. Elle attend jusqu'à 60 s et refuse le démarrage tant que :

- ce qui reste d'un moteur occupe plus de 2 Gio de mémoire GPU
- le pilote garde plus de 16 Gio qui ne sont attribués à aucun processus (mesuré : 1,1 Gio sans moteur)
- `nvidia-smi` ne répond pas en 10 s

systemd réessaie 15 s plus tard : la lane démarre donc d'elle-même une fois la mémoire revenue, et le cockpit affiche **waiting for GPU memory** avec la raison. Si rien n'occupe la mémoire et que le pilote la garde quand même, seul un redémarrage la libère.

## Comment voir venir un gel du DGX Spark ?

Surveillez le `MemAvailable` de l'hôte dans `/proc/meminfo`, pas la mémoire RSS. Le cockpit, installé par défaut, le lit et applique un plancher mémoire : quand `MemAvailable` passe sous 3 Gio alors que des requêtes s'exécutent, il interrompt toutes les générations en cours, jamais deux fois en 60 s et jamais quand rien ne tourne (`COCKPIT_MEM_FLOOR_GIB` fixe le seuil).

Les longs prompts peuvent le faire baisser eux aussi. Sur la lane flash telle que la version v1.5 la servait (2026-08-29), un prompt de 177K jetons a fait descendre `MemAvailable` à 0,8 Gio alors que la mémoire RSS du processus restait à 5,7 Gio. C'est pourquoi le proxy plafonne chaque prompt sur cette lane. Le moteur a réduit cette croissance depuis la v1.8, et la v1.10.2 a mesuré 1,52 Gio de marge de l'hôte consommés par un prompt de 249 500 jetons.

Deux choses paraissent alarmantes et ne le sont pas :

- Les lignes `NVRM: ... NV_ERR_NO_MEMORY` du journal du noyau sont courantes sur GB10 : 4 286 sur la machine de référence en trois semaines, dont deux tiers pendant des démarrages ordinaires du moteur. Le cockpit les compte sous la forme « GPU driver refused N allocations at the edge of memory » et n'entreprend rien.
- Pendant qu'un moteur sert, un nouveau contexte CUDA (un autre programme GPU qui démarre) peut échouer avec `CUDA_ERROR_OUT_OF_MEMORY` alors que `MemAvailable` indique 15 à 19 Gio. La mémoire réellement libre est alors d'environ 1 Gio, sans aucun bloc libre de 2 Mio ou plus, et les allocations du moteur lui-même réussissent toujours.

Un moteur tué par earlyoom apparaît dans `journalctl -u earlyoom` (code de sortie -15, sans trace d'appels).

## Le démarrage d'un modèle peut-il creuser la mémoire même avec un réglage sûr ?

Oui, et la lane Qwen3.8 Flash-Next FP4-Local l'a montré. À chacun de ses douze démarrages des 2026-10-19 et 20, `MemAvailable` est tombé entre 0,5 et 3,5 Gio, et au dernier il est passé de 37 à 1,05 Gio en 8 secondes. Le cache de l'allocateur de PyTorch grossissait pendant la préparation des poids, et sur un GB10 ce cache est la mémoire de la machine. L'unité fixe désormais à l'allocateur un plafond mémoire et un seuil de ramasse-miettes. Avec ce réglage, deux démarrages ont atteint leur point bas à 19,1 et 18,7 Gio, et sur quatre démarrages ultérieurs, relevés toutes les 0,2 ou 0,5 s, il est resté à 11,7 Gio ou plus : le réglage supprime le creux.

## Et sur un DGX Spark de 64 Go ?

Sur un DGX Spark de 64 Go, l'installeur lit la classe de la machine dans son MemTotal et n'installe que ce qui lui convient. Une lane qui exige une machine de 128 Go est refusée avant qu'un seul octet soit téléchargé, dans l'installeur, dans `switch-model.sh` et dans le Load du cockpit.
