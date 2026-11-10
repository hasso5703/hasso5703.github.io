---
layout: ../../../layouts/Guide.astro
slug: dgx-spark-1m-token-context
lang: fr
title: "DGX Spark, contexte de 1M de jetons : quels modèles, à quel coût"
description: "Une installation sans option sert Qwen3.8-27B avec une fenêtre de 1 010 000 jetons sur DGX Spark. Pool KV, autres lanes 1M, temps de préremplissage et bascule."
h1: "Un DGX Spark peut-il gérer un contexte de 1M de jetons ?"
published: "2026-10-26"
answer: "Oui, sur une machine de 128 Go. Une installation sans option sert Qwen3.8-27B avec une <strong>fenêtre de 1 010 000 jetons</strong> (YaRN, par défaut depuis la v1.12.1), et les lanes Nemotron 3.5 Super VL et Ornith 1.5 122B (une lane est un modèle prêt à servir) servent <strong>1 048 576</strong> jetons. Sur la 27B, la vraie limite est le pool KV décidé au démarrage, <strong>de 832 993 à 922 094 jetons</strong> sur seize démarrages, et l'installeur ajuste les limites des clients au pool obtenu à votre démarrage."
faq:
  - q: "Le contexte 1M est-il activé par défaut sur un DGX Spark ?"
    a: "Oui, sur une machine de 128 Go depuis la v1.12.1 : une installation sans option sert Qwen3.8-27B avec une fenêtre de 1 010 000 jetons. CONTEXT_MODE=native ./install.sh sert à la place la fenêtre de 262 144."
  - q: "Un seul prompt peut-il remplir toute la fenêtre de 1 010 000 jetons sur la 27B ?"
    a: "Non. Le pool KV décidé au démarrage a varié de 832 993 à 922 094 jetons sur seize démarrages, et le proxy refuse un prompt qui en dépasse 92 %. Le pool obtenu à votre démarrage est la vraie limite, et l'installeur y ajuste les limites d'opencode."
  - q: "Un DGX Spark de 64 Go gère-t-il un contexte 1M ?"
    a: "Non. Sur une machine de 64 Go, l'installeur refuse CONTEXT_MODE=1m, Nemotron 3.5 Super VL et Ornith 1.5 122B, car ils exigent un DGX Spark de 128 Go. Sa 27B sert sans la fenêtre 1M, avec 59 625 jetons de KV, donc un prompt de 54 855 jetons au plus."
  - q: "Pourquoi la lane flash reste-t-elle à 262 144 jetons ?"
    a: "Sur un seul GB10, une fenêtre 1M pour elle se paie d'un cache KV en fp8, que deux acteurs indépendants ont mesuré comme une perte de qualité sur le travail agentique. La lane flash garde un cache KV en bf16 et sa fenêtre de 262 144."
  - q: "Combien de temps avant le premier jeton sur un prompt de 1M de jetons ?"
    a: "Nemotron 3.5 Super VL a donné son premier jeton après environ 19 minutes et demie à un million de jetons, et après environ 16 s quand le même prompt est revenu depuis le cache de préfixe. Sur la 27B, une requête de 690K jetons a demandé 40 minutes de préremplissage à froid."
  - q: "Les clients ont-ils besoin du proxy keepalive à 1M ?"
    a: "Oui. Un préremplissage à froid peut laisser la connexion silencieuse pendant des dizaines de minutes, et le proxy (port 30001 par défaut) comble ce silence par des keepalives conformes au protocole toutes les 10 s. Les clients agents doivent passer par lui, pas par le port du moteur."
sources:
  - label: "README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md"
  - label: "docs/context-1m.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/context-1m.md"
  - label: "docs/opencode.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/opencode.md"
  - label: "docs/clients.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/clients.md"
  - label: "docs/nemotron-super-lane.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/nemotron-super-lane.md"
  - label: "docs/ornith-lane.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/ornith-lane.md"
  - label: "BENCHMARKS.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/BENCHMARKS.md"
related:
  - label: "Que faire tourner sur un DGX Spark de 64 Go"
    href: "/fr/dgx-spark-64gb/"
  - label: "Toutes les machines GB10"
    href: "/fr/machines/"
  - label: "Tous les guides"
    href: "/fr/guides/"
---

## Quels modèles servent un contexte de 1M de jetons sur un DGX Spark ?

Trois lanes, sur une machine de 128 Go :

| Lane | Fenêtre (jetons) | Cache KV mesuré | Comment elle est servie |
|---|---|---|---|
| Qwen3.8 27B, NVFP4 · RadixArk ou abliterated NVFP4 · edp1096 (la lane par défaut) | 1 010 000 | de 832 993 à 922 094 jetons sur seize démarrages | SGLang, YaRN appliqué par patch aux configurations |
| Nemotron 3.5 Super VL, 120B dont 12B actifs | 1 048 576 | de 1 166 215 à 1 382 265 jetons sur deux démarrages | vLLM, toute la fenêtre du modèle, 4 requêtes à la fois |
| Ornith 1.5 122B | 1 048 576 | 1 301 680 jetons, fixe | vLLM, YaRN au facteur 4 sur ses 262 144 natifs |

La lane flash (Qwen3.8 Flash-Next, 176B) reste à 262 144 jetons avec un cache KV en bf16. Sur un seul GB10, une fenêtre 1M pour elle se paie d'un cache KV en fp8, que deux acteurs indépendants ont mesuré comme une perte de qualité sur le travail agentique. Bolt et Kolibri-1 servent 262 144 eux aussi. Sur un DGX Spark de 64 Go, l'installeur refuse `CONTEXT_MODE=1m` et les deux lanes 1M, car elles exigent une machine de 128 Go.

## Comment la 27B sert-elle 1 010 000 jetons ?

La fenêtre vient de la mise à l'échelle statique YaRN, facteur 4,0 sur les 262 144 positions d'origine du checkpoint. Le `patch-yarn.py` de l'installeur l'écrit dans les deux fichiers `config.json` en cache, celui du modèle cible et celui de son brouillon DFlash2 (sinon le brouillon plante au chargement), et garde les originaux à côté sous le nom `config.json.pre-yarn`. L'unité ajoute `--context-length 1010000`, `--mem-fraction-static 0.76` et `HF_HUB_OFFLINE=1`, pour qu'aucune vérification des métadonnées du Hub ne puisse défaire en silence les configurations modifiées.

Le proxy keepalive devient indispensable. Un préremplissage à froid de 690K jetons peut laisser la connexion silencieuse pendant des dizaines de minutes : le proxy envoie donc des keepalives conformes au protocole toutes les 10 s, aux frontières des événements SSE, ferme la connexion amont quand le client s'en va, et ne signale une erreur explicite qu'après 3 600 s de vrai silence. Les clients agents doivent utiliser le port du proxy (30001 par défaut). Le port du moteur sert à curl et aux benchmarks.

## Pourquoi le pool KV est-il plus petit que la fenêtre 1M ?

Le pool est ce que la fraction de 0,76 laisse après les poids, une part limitée par le piège de la mémoire unifiée du GB10, et il change d'un démarrage à l'autre. Sur seize démarrages de la 27B sur la machine de référence, il a varié de 832 993 à 922 094 jetons, sous la fenêtre de 1 010 000. Le proxy refuse un prompt qui dépasse 92 % du pool, et le prompt et la réponse doivent y tenir ensemble : avec `CONTEXT_MODE=1m`, la limite est donc le pool, pas la fenêtre. La vue Lanes du cockpit affiche le vôtre.

L'installeur ajuste donc les clients à votre démarrage. La configuration générée d'opencode part de 700 000 jetons de contexte et de 200 000 de sortie. Son pire cas, une compaction à 680 000 plus une étape d'agent de 43 863 jetons et 200 000 de sortie, fait 923 863 jetons, au-dessus de tous les pools mesurés. À la fin de chaque installation 1m, une fois le moteur lancé, `oc-fit-limits.py` lit le pool obtenu à votre démarrage et réécrit les limites pour s'y ajuster, à la hausse ou à la baisse. Depuis la v1.18.2, le cockpit fait le même ajustement après une bascule et un Start, et son bouton refait l'ajustement après un redémarrage. Claude Code reçoit le même ajustement par `claude-local`, installé à côté de `oc` : son budget de contexte est le contexte d'opencode plus 23 000, et son budget de réponse est celui d'opencode.

Plusieurs agents à la fois partagent un seul pool. Au-delà, chaque tour recalcule tout son prompt : gardez donc la somme de leurs contextes sous le pool.

Les cibles FP8 contiennent moins : 771 139 jetons contre 863 398 pour NVFP4 sur la même unité 1m, et leur plafond mémoire à 1M n'est pas mesuré. Faites-les tourner à la fenêtre native, ou surveillez le `MemAvailable` de l'hôte.

Ornith évite la loterie du démarrage en fixant son cache KV à 17 Gio, qui contient 1 301 680 jetons. Laissé à une part de mémoire de 0,8, il donnait de 829 030 à 1 149 938 jetons d'un démarrage à l'autre, soit moins que la fenêtre à certains démarrages.

## Combien de temps faut-il pour répondre à un prompt de 1M de jetons ?

Le préremplissage à froid est le coût d'un long contexte :

- **27B :** une vraie requête de 690K jetons a demandé 40 minutes de préremplissage à froid, puis a été mise en cache. Le 2026-09-21, sur un prompt de 651 583 jetons, le débit de préremplissage est tombé de 320 tok/s à son début à 184 à sa fin, à mesure que le contexte grandissait.
- **Super VL :** le premier jeton est venu après 19 min 22 s à 19 min 28 s à un million de jetons, et après 15,3 à 16,3 s quand le même prompt est revenu depuis le cache de préfixe. Un code caché dans des prompts de 32 000 à 1 000 000 jetons a été retrouvé 12 fois sur 12.
- **Ornith :** un code caché à 499 974 jetons a été retrouvé, son prompt prérempli en 19 min 27 s. Un autre à 900 055 jetons, brouillon désactivé, a pris 55 minutes à environ 270 jetons par seconde.

Un prompt qui revient est servi depuis le cache de préfixe, et c'est ce qui garde rapides les tours suivants d'un agent.

## La qualité tient-elle au-delà de 262 144 jetons ?

Sur la 27B, elle n'est pas évaluée formellement, et le projet traite le mode 1M comme un préréglage expérimental. En pratique, elle tient : une session opencode continue a atteint 535 361 jetons, deux fois la fenêtre native, avec zéro compaction, environ 360K jetons générés, 239 étapes d'agent et 274 appels d'outils, et aucune nouvelle tentative.

Avec Ornith, le coût a été mesuré. YaRN au facteur 4 coûte aux textes courts 0,4 % de perplexité (0,66 % en allemand), et GSM8K et HumanEval ont donné 98,8 % et 93,9 % contre 97,6 % et 95,1 % à sa fenêtre native, dans le bruit du moteur d'une exécution à l'autre.

## Comment activer ou désactiver le contexte 1M ?

```bash
# a fresh install serves the 27B at 1,010,000 tokens
curl -fsSL https://get.alzeo.ai | bash
# the 262,144 window instead
curl -fsSL https://raw.githubusercontent.com/hasso5703/alzeo/main/get.sh | CONTEXT_MODE=native bash
# on an installed box, from the clone
CONTEXT_MODE=native ./install.sh
CONTEXT_MODE=1m ./install.sh
```

Une relance garde le mode déjà installé, dans les deux sens. Passer en natif garde le proxy et restaure les originaux `config.json.pre-yarn` par-dessus les configurations modifiées de la cible et du brouillon. Depuis la v1.36.0, une fenêtre native que seule une installation antérieure à la v1.12.1 a mise sur la machine, et que rien n'enregistre comme choisie, passe en 1m à la prochaine mise à jour, qui le dit avant sa première étape.

Les deux lanes de 1 048 576 jetons n'ont besoin d'aucun mode de contexte : appuyez sur **Load** dans la vue Lanes du cockpit, ou lancez `./prepare-lane.sh nemotron-super` la première fois, puis `./switch-model.sh nemotron-super` et les commandes qu'il affiche (`ornith-122b` de la même façon). `./switch-model.sh stock` revient à la 27B. Super VL demande 77 Go de disque à côté de la lane Nemotron (102 sans elle), et Ornith 78 Go à côté de la lane Qwen3.8 Flash-Next FP4-Local (96 sans elle).
