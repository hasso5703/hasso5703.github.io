---
layout: ../../layouts/Guide.astro
slug: image-and-video-generation-dgx-spark
title: "Image and video generation on a DGX Spark, measured"
description: "Qwen-Image 2.1 makes a 1024×1024 image in 7.5 s with its Turbo on a DGX Spark, and MiniMax-H3 4 s of video with its sound in about two minutes."
h1: "Image and video generation on a DGX Spark"
published: "2026-10-26"
answer: "This installer serves Qwen-Image 2.1 on SGLang Diffusion: a 1024×1024 image takes 34.3 s at 40 steps and <strong>7.5 s</strong> with its eight-step Turbo. MiniMax-H3 makes 4 s of 480P video with its sound in 126.2 to 127.9 s with its Turbo adapter, and 622.8 to 632.5 s at 50 steps without it. Both run on a 128 GB DGX Spark and are driven from the cockpit."
faq:
  - q: "How long does a DGX Spark take to make an image?"
    a: "With Qwen-Image 2.1 on this installer, 7.5 s for a 1024×1024 image with its eight-step Turbo, and 34.3 s at 40 steps without it. A 2048×2048 image takes 40.6 s with the Turbo."
  - q: "Can a DGX Spark make video with sound?"
    a: "Yes. MiniMax-H3 makes the sound with the picture. On this installer, 4 s of 480P video takes 126.2 to 127.9 s with its Turbo adapter, measured on three prompts with the same seed."
  - q: "Do I need ComfyUI?"
    a: "No. This installer serves both models on SGLang Diffusion, behind the cockpit's Image and Video views. ComfyUI is the other common route, with its own models and workflows."
  - q: "Does making images stop the chat model?"
    a: "Yes. One lane serves at a time: loading the image lane switches the boot, stops the lane that serves and starts the image lane. Loading a text lane brings the chat model back."
  - q: "Can a 64 GB DGX Spark make images or video with this installer?"
    a: "No. Both lanes need a 128 GB DGX Spark, and a 64 GB box refuses them before anything is downloaded."
sources:
  - label: "docs/image-lane.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/image-lane.md"
  - label: "docs/video-lane.md"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/docs/video-lane.md"
  - label: "README.md, Images and Videos"
    href: "https://github.com/hasso5703/dgx-spark-qwen38/blob/main/README.md"
  - label: "NVIDIA forum: Qwen-Image-2.1 on DGX Spark, 54 s per 1024² image"
    href: "https://forums.developer.nvidia.com/t/384774"
  - label: "NVIDIA forum: My ComfyUI setup and patches"
    href: "https://forums.developer.nvidia.com/t/368344"
related:
  - label: "Run Qwen-Image 2.1 on a DGX Spark"
    href: "/models/qwen-image-2-1/"
  - label: "Run MiniMax-H3 on a DGX Spark"
    href: "/models/minimax-h3/"
  - label: "How to run a local LLM on a DGX Spark"
    href: "/guides/run-local-llm-dgx-spark/"
---

## How fast is image generation on a DGX Spark?

Qwen-Image 2.1 on SGLang Diffusion, one image per request, measured on the reference box:

| Size | Base, 40 steps | Turbo, 8 steps |
|---|---|---|
| 512×512 | 7.8 s | 1.8 s |
| 768×768 | 19.5 s | 4.3 s |
| 1024×1024 | 34.3 s | 7.5 s |
| 1664×928 | 54.6 s | 11.9 s |
| 2048×2048 | 182.8 s | 40.6 s |

Time grows with the steps, and faster than the pixels: four times the pixels of a 1024×1024 image cost about 5.3 times the time. Memory peaked between 32.1 and 45.4 GiB across these sizes.

## How does that compare with other setups?

On the same model with another stack, an owner running Qwen-Image 2.1 in bf16 with diffusers measured 28.3 s at 20 steps and 54.1 s at 40 steps for a 1024² image, and 4 min 16 s at 40 steps for 2048² ([thread 384774](https://forums.developer.nvidia.com/t/384774)).

In ComfyUI, another owner measured FLUX.1-dev at 32.61 s warm and 113.17 s cold for a 1024×1024 image, and FLUX.2-dev (fp8mixed) at 50.14 s warm ([thread 368344](https://forums.developer.nvidia.com/t/368344)). Those are other models, shown for scale, not a like-for-like test.

## What does the image lane do?

It serves text to image, image editing and transparent (RGBA) images. Its Turbo, Qwen's eight-step distillation of the same model, is a second checkpoint of the lane: about four and a half times faster, and close to the base on photographs, portraits, illustrations and short text. A plain install puts the lane on the box, and its first Load builds its runtime and fetches its checkpoint: 46 GB (34 GB of checkpoint, 12 GB of runtime and its build). The Turbo fetches 32.5 GB at its first switch.

## How fast is video generation?

MiniMax-H3, served with the SGLang cookbook's recipe, makes text to video with the sound made with the picture, and takes a first and a last frame to start and end from. For 4 s at 480P, on three prompts with the same seed:

| | Base, 50 steps | Turbo adapter, 8 steps |
|---|---|---|
| End to end | 622.8 to 632.5 s | 126.2 to 127.9 s |
| Of which denoising | 598.6 to 599.3 s | 102.5 to 104.1 s |
| Of which video decode | 22.8 to 23.0 s | 22.8 to 23.0 s |

Its first Load needs about 174 GB of free disk: 145 GB of checkpoint and Turbo adapter, 12 GB of runtime and its build, 17 GB for the runtime's own caches.

## How do I use them?

From the cockpit: on its Lanes view, pick Qwen-Image 2.1 or MiniMax-H3 and press **Load**, one action that switches the boot, stops the lane that serves and starts this one. Then the Image and Video views drive them. The lanes listen on `127.0.0.1:30020` and `127.0.0.1:30022`, on the box itself, and not through the API on port 30001.

From a terminal, in the repo folder on the box:

```bash
./prepare-lane.sh image   # the first time only, builds the lane
./switch-model.sh image   # switches the boot, then prints the stop and start commands to run
```

`video` works the same way, and `image-turbo` switches to the Turbo.

## Can a 64 GB DGX Spark do it?

Not with this installer: both lanes need a 128 GB DGX Spark, and the installer refuses them on a 64 GB box before a byte is downloaded. [What runs on 64 GB](/dgx-spark-64gb/).
