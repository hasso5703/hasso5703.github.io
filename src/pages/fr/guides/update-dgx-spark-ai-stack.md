---
layout: ../../../layouts/Guide.astro
slug: update-dgx-spark-ai-stack
lang: fr
title: "Mettre à jour la pile d'IA d'un DGX Spark sans rien casser"
description: "Une seule commande installe et met à jour la pile d'IA d'un DGX Spark : images et checkpoints épinglés, vos choix conservés, le modèle qui sert prouvé."
h1: "Mettre à jour la pile d'IA d'un DGX Spark sans rien casser"
published: "2026-10-26"
answer: "Relancez la commande qui l'a installée. Elle met à jour le dépôt, puis lance l'installeur épinglé : les images de moteur sont épinglées par leur empreinte et les checkpoints par leur révision, vos choix sont retenus, et la lane (un modèle prêt à servir) qui sert prouve qu'elle sert avant la fin de la mise à jour."
faq:
  - q: "Comment mettre à jour les modèles et les moteurs d'IA de mon DGX Spark ?"
    a: "Relancez la commande d'installation. Elle met à jour le dépôt dans ~/dgx-spark-qwen38 et lance l'installeur épinglé, qui met à jour chaque lane déjà présente sur la machine."
  - q: "Une mise à jour va-t-elle changer mes réglages ?"
    a: "Pas ceux que vous avez choisis. Relancer l'installeur retient le modèle installé, le mode de contexte, le port, le cache Hugging Face, et les choix pour opencode et le cockpit. Une valeur posée sur la machine seulement par défaut, par une version plus ancienne, et que rien n'enregistre comme votre choix, passe à la valeur par défaut actuelle, et chaque passage liste, avant sa première étape, ce qui change et ce qui reste."
  - q: "Comment savoir qu'une version plus récente existe ?"
    a: "La vue Settings du cockpit indique si une version plus récente est sortie et donne la commande qui met à jour la pile."
  - q: "Une mise à jour télécharge-t-elle tous les modèles ?"
    a: "Non. Une lane que la machine n'a jamais eue reçoit ses unités, et son premier Load depuis le cockpit la prépare. Une lane déjà présente sur la machine est mise à jour en entier."
sources:
  - label: "README.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md"
  - label: "Versions publiées"
    href: "https://github.com/hasso5703/alzeo/releases"
related:
  - label: "Pourquoi un DGX Spark se fige au chargement d'un modèle"
    href: "/fr/guides/dgx-spark-freezes-when-loading-a-model/"
  - label: "Tous les guides"
    href: "/fr/guides/"
---

## Que fait la commande de mise à jour ?

Une seule commande fait la première installation et chaque mise à jour. Elle clone ou met à jour `~/dgx-spark-qwen38`, puis lance l'installeur épinglé : la lane qui sert (la 27B, ou Bolt sur une machine de 64 Go), le proxy keepalive, le raccordement d'opencode, le cockpit et sa vue Agent, et chaque autre lane à la demande.

## Pourquoi une mise à jour épinglée est-elle prévisible ?

Les images de moteur sont épinglées par leur empreinte et les checkpoints par leur révision : une mise à jour installe donc exactement ce que la version épingle. La lane qui sert prouve qu'elle sert avant la fin de l'installation.

## Mes choix sont-ils conservés ?

Oui. Relancer l'installeur retient le modèle installé, le mode de contexte, le port, le cache Hugging Face, et vos choix d'activer ou non opencode et le cockpit, et chaque passage dit lesquels.

## Et les lanes que je n'ai jamais utilisées ?

La mise à jour d'une machine ajoute les lanes qu'elle n'a pas encore, à la demande : une lane que la machine n'a jamais eue reçoit ses unités, et son premier Load depuis le cockpit la prépare, sous votre compte, sans sudo. Une lane déjà présente sur la machine est mise à jour en entier.

## Comment savoir qu'une mise à jour est sortie ?

La vue Settings du cockpit indique si une version plus récente est sortie et vous donne la commande qui met à jour la pile. Chaque version a ses notes sur [GitHub](https://github.com/hasso5703/alzeo/releases).
