---
layout: project
title: "Personality Questionnaires from LLMs"
subtitle: "Turning any text into a personality questionnaire — and predicting the answers before anyone responds"
collaborators:
  - name: Rotem Monsa
  - name: Aviv Zohar
    url: https://www.avivz.net
  - name: Shahar Arzy
    url: https://mind.huji.ac.il
tags: [AI, LLM, psychology, personality, psychometrics]
papers:
  - title: "Generating and Analyzing Personality Questionnaires using Large Language Models (iScience, 2026 — open access)"
    url: https://doi.org/10.1016/j.isci.2026.116909
links:
  - title: "Coverage: Neuroscience News"
    url: https://neurosciencenews.com/chatgpt-ai-personality-tests-31192/
  - title: "Coverage: Medical Xpress"
    url: https://medicalxpress.com/news/2026-08-chatgpt-generate-personality-people-responses.html
  - title: "Coverage: TechRadar"
    url: https://www.techradar.com/pro/chatgpt-isnt-just-predicting-words-anymore-its-now-predicting-human-thoughts
---

Building a personality questionnaire the classical way takes years: item pools are drafted by experts, pruned through pilot studies, and validated on large samples before anyone trusts the result. In our paper in [iScience](https://doi.org/10.1016/j.isci.2026.116909), we show that a large language model can compress much of that pipeline into minutes — generating a Likert-scale questionnaire from essentially *any* source text, scoring its own items for quality, and, most strikingly, predicting how people will answer before a single response is collected. This project sits far from my usual home turf of blockchain protocols; it grew out of a collaboration with Rotem Monsa and Shahar Arzy at the Hebrew University's medical school, where the tools of AI meet the older question of how personality should be measured at all.

## The lexical hypothesis, revisited

The Big Five — the dominant model of personality in psychology — rests on the *lexical hypothesis*: the idea that the personality traits that matter most are the ones languages have evolved words for. Factor-analyze how people describe themselves and each other, the argument goes, and the important dimensions of personality fall out of the vocabulary.

Large language models are, in a sense, the lexical hypothesis made executable. They are trained on enormous text corpora and absorb precisely the linguistic regularities — which trait words co-occur, which descriptions imply which behaviors — that the hypothesis says encode personality. That suggests a shortcut: instead of using language *indirectly*, via decades of surveys and factor analysis, ask the model to operationalize a body of text directly into a measurement instrument.

## What we built

Our pipeline uses GPT-4 twice. First, given a source text and structured few-shot prompts seeded with examples from the standard Big Five Inventory (BFI-44), it converts the text's descriptive content into Likert-scale questionnaire items. Second, the model turns evaluator: it scores the quality of the generated items and predicts the response patterns human participants will produce — *ahead of* any data collection.

To test this, we generated two questionnaires from deliberately contrasting sources:

- **A DSM-based questionnaire** — 50 items derived from the personality-disorders section of the DSM-5, five items per disorder across ten disorders, grouped into the clinical clusters A, B, and C. This inverts the logic of the DSM's own Alternative Model for Personality Disorders: rather than mapping normal personality traits onto disorders, it maps disorder descriptions back onto underlying personality dimensions.
- **An astrology-based questionnaire** — 60 items from a popular astrology book, five per zodiac sign, grouped into the four classical elements. Astrology is full of structured, trait-descriptive language with no scientific grounding, which makes it the perfect contrast case: it lets us separate the quality of individual item content from the validity of the organizing framework behind it.

Both questionnaires, alongside the BFI-44, were administered to 600 adults.

## What we found

The results split along exactly the line the design was probing. Internal consistency was high for the BFI and for the DSM-based questionnaire, but low for the astrology-based one — the zodiac's categories simply don't carve people into coherent groups. Yet at the level of *individual items*, both generated questionnaires — astrology included — predicted diverse real-life outcomes at levels comparable to the BFI itself. A well-written trait-descriptive item carries signal even when the theory that produced it is empty; what astrology lacks is not evocative descriptions of people but a valid way of organizing them.

The model's forecasting ability held up too: GPT-4's predicted response patterns matched what the 600 participants actually produced, for both questionnaires. The population-level statistics of a personality instrument can apparently be simulated before the instrument is ever fielded — which suggests a future in which candidate questionnaires are pre-screened *in silico*, and only the survivors graduate to (expensive) human validation.

## Why it matters

The immediate contribution is methodological: a scalable, validated recipe for corpus-based personality research beyond the handful of traditional models. Any structured body of text describing how people differ — clinical manuals, literary archives, workplace competency frameworks — becomes a candidate source for a measurement instrument, with the LLM handling generation, quality control, and a first pass of validation. More broadly, the study is a data point on what LLMs have actually learned about people. The models are not just fluent; they encode enough of the covariance structure of human self-description to anticipate it quantitatively.

The usual caveats apply, and we are careful about them in the paper: the model's predictions concern populations, not individuals, and a questionnaire's psychometric life doesn't end at internal consistency — factor structure, test–retest reliability, and cross-cultural robustness all deserve their own scrutiny. But as a proof of concept, the direction seems clear: the questionnaire-construction bottleneck that shaped a century of personality psychology is loosening.
