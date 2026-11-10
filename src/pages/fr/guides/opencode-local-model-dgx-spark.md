---
layout: ../../../layouts/Guide.astro
slug: opencode-local-model-dgx-spark
lang: fr
title: "opencode avec un modèle local sur DGX Spark, configuré pour vous"
description: "L'installeur adapte opencode au modèle de votre DGX Spark : un lanceur oc qui lève le plafond caché de 32 000 jetons en sortie, des limites ajustées au pool."
h1: "opencode avec un modèle local sur un DGX Spark"
published: "2026-10-26"
answer: "Lancez <code>oc</code> sur la machine. L'installeur écrit la configuration de fournisseur d'opencode, pointée sur le proxy, un lanceur <code>oc</code> qui lève le plafond caché d'opencode de 32 000 jetons en sortie, des limites ajustées au pool mémoire de la lane (un modèle prêt à servir), des variantes d'effort de raisonnement, et un gabarit de conversation (chat template) corrigé pour les clients agentiques."
faq:
  - q: "opencode fonctionne-t-il avec un modèle local sur un DGX Spark ?"
    a: "Oui. C'est le client principal du projet : l'installeur écrit sa configuration de fournisseur, et son modèle par défaut suit la lane que sert la machine."
  - q: "Pourquoi la configuration pointe-t-elle sur le port 30001 et pas sur le moteur ?"
    a: "Le port 30001 est le proxy keepalive. Il garde les longs préremplissages en vie pour le client, interrompt les décodages quand un client disparaît, et refuse ce qui ne peut pas être servi, avec une réponse sur laquelle le client peut agir. Le port du moteur ne répond que sur la machine."
  - q: "Quelle version d'opencode installe-t-il ?"
    a: "Une seule version épinglée, la même sur chaque machine."
  - q: "Puis-je me passer d'opencode ?"
    a: "Oui. ./install.sh --no-opencode laisse de côté l'intégration d'opencode : sa configuration, le lanceur oc et le modèle par défaut qui suit chaque bascule. Le choix tient d'une mise à jour à l'autre, jusqu'à --with-opencode ou --recommended."
  - q: "opencode est-il disponible dans le navigateur ?"
    a: "Oui. La vue Agent du cockpit fait tourner opencode web sur la machine, depuis un ordinateur portable ou un téléphone."
sources:
  - label: "README.md, intégration d'opencode"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md#opencode-integration"
  - label: "docs/opencode.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/opencode.md"
  - label: "docs/clients.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/clients.md"
related:
  - label: "Claude Code avec un modèle local sur un DGX Spark"
    href: "/fr/guides/claude-code-local-model-dgx-spark/"
  - label: "Tous les guides"
    href: "/fr/guides/"
---

## Que règle l'installeur pour opencode ?

- Une configuration de fournisseur prête à l'emploi, pointée sur le proxy keepalive du port 30001.
- Un lanceur `oc` qui lève le plafond caché d'opencode de 32 000 jetons en sortie.
- Des limites ajustées au pool que la lane obtient au démarrage, par l'installeur, puis à nouveau à chaque Load dans le cockpit.
- Des variantes d'effort de raisonnement.
- Un gabarit de conversation (chat template) corrigé pour les clients agentiques.

```bash
oc          # opencode on the lane the box serves
```

## Pourquoi le port du proxy et pas celui du moteur ?

Les clients agentiques se connectent au proxy keepalive, pas au moteur. Il envoie les keepalives qui empêchent les chiens de garde des clients de tuer les longs préremplissages, interrompt les décodages quand des clients disparaissent, et refuse ce qui ne peut pas être servi, avec un corps de réponse sur lequel un client peut agir. Le port du moteur parle les mêmes API sans cette protection, et il ne répond que sur la machine.

## Le modèle change-t-il avec la lane ?

Oui. Le modèle par défaut de la configuration d'opencode suit la lane que sert la machine.

## Quel opencode installe-t-il ?

Une seule version épinglée, la même sur chaque machine.

## Puis-je aussi utiliser pi ou oh-my-pi ?

Oui. La même configuration générée est la source unique de pi et d'omp (oh-my-pi) : `./pi-gen.py` en dérive leurs configurations prêtes à l'emploi.

## Puis-je l'utiliser dans le navigateur ?

Oui. La vue Agent du cockpit fait tourner opencode web sur la machine, depuis un ordinateur portable ou un téléphone.

## Puis-je me passer d'opencode ?

`./install.sh --no-opencode` laisse de côté l'intégration d'opencode : sa configuration, le lanceur `oc` et le modèle par défaut qui suit chaque bascule. Le choix tient d'une mise à jour à l'autre, jusqu'à `--with-opencode` ou `--recommended`.
