---
layout: ../../../layouts/Guide.astro
slug: image-and-video-generation-dgx-spark
lang: fr
title: "Génération d'images et de vidéos sur DGX Spark, mesurée"
description: "Sur DGX Spark, Qwen-Image 2.1 fait une image 1024×1024 en 7,5 s avec son Turbo, et MiniMax-H3 4 s de vidéo sonore en deux minutes environ."
h1: "Génération d'images et de vidéos sur un DGX Spark"
published: "2026-10-26"
answer: "Cet installeur sert Qwen-Image 2.1 sur SGLang Diffusion : une image 1024×1024 prend 34,3 s en 40 étapes et <strong>7,5 s</strong> avec son Turbo en huit étapes. MiniMax-H3 fait 4 s de vidéo 480P avec sa bande sonore en 126,2 à 127,9 s avec son adaptateur Turbo, et en 622,8 à 632,5 s en 50 étapes sans lui. Les deux tournent sur un DGX Spark de 128 Go et se pilotent depuis le cockpit."
faq:
  - q: "Combien de temps un DGX Spark met-il pour faire une image ?"
    a: "Avec Qwen-Image 2.1 sur cet installeur, 7,5 s pour une image 1024×1024 avec son Turbo en huit étapes, et 34,3 s en 40 étapes sans lui. Une image 2048×2048 prend 40,6 s avec le Turbo."
  - q: "Un DGX Spark peut-il faire de la vidéo avec du son ?"
    a: "Oui. MiniMax-H3 fait le son en même temps que l'image. Sur cet installeur, 4 s de vidéo 480P prennent 126,2 à 127,9 s avec son adaptateur Turbo, mesurés sur trois prompts avec la même graine."
  - q: "Ai-je besoin de ComfyUI ?"
    a: "Non. Cet installeur sert les deux modèles sur SGLang Diffusion, derrière les vues Image et Video du cockpit. ComfyUI est l'autre voie courante, avec ses propres modèles et workflows."
  - q: "Faire des images arrête-t-il le modèle de conversation ?"
    a: "Oui. Une seule lane sert à la fois : charger la lane d'images change la lane lancée au démarrage, arrête la lane qui sert et démarre la lane d'images. Charger une lane de texte ramène le modèle de conversation."
  - q: "Un DGX Spark de 64 Go peut-il faire des images ou de la vidéo avec cet installeur ?"
    a: "Non. Les deux lanes demandent un DGX Spark de 128 Go, et une machine de 64 Go les refuse avant tout téléchargement."
sources:
  - label: "docs/image-lane.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/image-lane.md"
  - label: "docs/video-lane.md"
    href: "https://github.com/hasso5703/alzeo/blob/main/docs/video-lane.md"
  - label: "README.md, images et vidéos"
    href: "https://github.com/hasso5703/alzeo/blob/main/README.md"
  - label: "Forum NVIDIA : Qwen-Image-2.1 sur DGX Spark, 54 s par image 1024²"
    href: "https://forums.developer.nvidia.com/t/384774"
  - label: "Forum NVIDIA : ma configuration ComfyUI et mes correctifs"
    href: "https://forums.developer.nvidia.com/t/368344"
related:
  - label: "Faire tourner Qwen-Image 2.1 sur un DGX Spark"
    href: "/fr/models/qwen-image-2-1/"
  - label: "Faire tourner MiniMax-H3 sur un DGX Spark"
    href: "/fr/models/minimax-h3/"
  - label: "Comment faire tourner un LLM local sur un DGX Spark"
    href: "/fr/guides/run-local-llm-dgx-spark/"
---

## Quelle est la vitesse de génération d'images sur un DGX Spark ?

Qwen-Image 2.1 sur SGLang Diffusion, une image par requête, mesuré sur la machine de référence :

| Taille | Base, 40 étapes | Turbo, 8 étapes |
|---|---|---|
| 512×512 | 7,8 s | 1,8 s |
| 768×768 | 19,5 s | 4,3 s |
| 1024×1024 | 34,3 s | 7,5 s |
| 1664×928 | 54,6 s | 11,9 s |
| 2048×2048 | 182,8 s | 40,6 s |

Le temps croît avec les étapes, et plus vite que les pixels : quatre fois les pixels d'une image 1024×1024 coûtent environ 5,3 fois le temps. Le pic de mémoire s'est situé entre 32,1 et 45,4 Gio selon ces tailles.

## Comment cela se compare-t-il à d'autres configurations ?

Sur le même modèle avec une autre pile, un possesseur qui faisait tourner Qwen-Image 2.1 en bf16 avec diffusers a mesuré 28,3 s en 20 étapes et 54,1 s en 40 étapes pour une image 1024², et 4 min 16 s en 40 étapes pour 2048² ([fil 384774](https://forums.developer.nvidia.com/t/384774)).

Dans ComfyUI, un autre possesseur a mesuré FLUX.1-dev à 32,61 s à chaud et 113,17 s à froid pour une image 1024×1024, et FLUX.2-dev (fp8mixed) à 50,14 s à chaud ([fil 368344](https://forums.developer.nvidia.com/t/368344)). Ce sont d'autres modèles, montrés pour donner un ordre de grandeur, pas un test à conditions égales.

## Que fait la lane d'images ?

Cette lane, un modèle prêt à servir, fait de la génération d'images à partir de texte, de l'édition d'images et des images transparentes (RGBA). Son Turbo, la distillation en huit étapes du même modèle par Qwen, est un second checkpoint de la lane : environ quatre fois et demie plus rapide, et proche de la base sur les photographies, les portraits, les illustrations et le texte court. Une installation sans option met la lane sur la machine, et son premier Load construit son environnement d'exécution et récupère son checkpoint : 46 Go (34 Go de checkpoint, 12 Go d'environnement d'exécution et de sa construction). Le Turbo récupère 32,5 Go à la première bascule vers lui.

## Quelle est la vitesse de génération vidéo ?

MiniMax-H3, servi avec la recette du cookbook de SGLang, fait de la vidéo à partir de texte, avec le son produit en même temps que l'image, et accepte une image de départ et une image d'arrivée. Pour 4 s en 480P, sur trois prompts avec la même graine :

| | Base, 50 étapes | Adaptateur Turbo, 8 étapes |
|---|---|---|
| De bout en bout | 622,8 à 632,5 s | 126,2 à 127,9 s |
| Dont débruitage | 598,6 à 599,3 s | 102,5 à 104,1 s |
| Dont décodage vidéo | 22,8 à 23,0 s | 22,8 à 23,0 s |

Son premier Load demande environ 174 Go d'espace disque libre : 145 Go de checkpoint et d'adaptateur Turbo, 12 Go d'environnement d'exécution et de sa construction, 17 Go pour les caches propres à l'environnement d'exécution.

## Comment les utiliser ?

Depuis le cockpit : dans sa vue Lanes, choisissez Qwen-Image 2.1 ou MiniMax-H3 et appuyez sur **Load**, une seule action qui change la lane lancée au démarrage, arrête la lane qui sert et démarre celle-ci. Ensuite, les vues Image et Video les pilotent. Les lanes écoutent sur `127.0.0.1:30020` et `127.0.0.1:30022`, sur la machine elle-même, et pas à travers l'API du port 30001.

Depuis un terminal, dans le dossier du dépôt sur la machine :

```bash
./prepare-lane.sh image   # the first time only, builds the lane
./switch-model.sh image   # switches the boot, then prints the stop and start commands to run
```

`video` fonctionne de la même façon, et `image-turbo` bascule sur le Turbo.

## Un DGX Spark de 64 Go peut-il le faire ?

Pas avec cet installeur : les deux lanes demandent un DGX Spark de 128 Go, et l'installeur les refuse sur une machine de 64 Go avant le moindre octet téléchargé. [Ce qui tourne sur 64 Go](/fr/dgx-spark-64gb/).
