---
layout: post
title: "SlideSonnet"
subtitle: "Vibe-Coding a Lecture Compiler"
date: 2026-03-09
authors:
  - name: Aviv Zohar
    url: https://www.avivz.net
tags: [LLMs, tools, slidesonnet]
---

I vibe-coded a tool that compiles Markdown slides into narrated lecture videos. Along the way I ran into some interesting questions — about flipped classrooms, AI voices, and fact-checking generated content. Here are some of my thoughts.

## Why lectures need to change

Here's a tension I think about a lot. Students now have access to AI tools that can help them with essentially any homework assignment. You can debate whether that's good or bad, but it's the reality. And it means the traditional model — attend lecture passively, then go home and struggle through problem sets — is increasingly broken. The struggling-at-home part, which is where deep learning used to happen, is now largely outsourced to Claude or ChatGPT.

I'm a strong believer in flipped classrooms as a response. Let students watch lectures at home, at their own pace, rewinding the parts they didn't get. Then use the precious in-person class time for what AI *can't* easily replace: discussion, Socratic questioning, working through problems together, one-on-one mentoring. The place where a professor actually adds value isn't reading slides aloud — it's the conversation that happens when a student is stuck and you can see exactly where their reasoning went wrong.

But flipping a classroom means you need recorded lectures. Lots of them. And they need to be maintainable — courses change, material gets updated, you find a better way to explain something mid-semester. This is where the pain begins.

## The pain of recording lectures

If you've ever recorded a narrated lecture, you know. You set up your screen, hit record, talk through forty slides, and on slide 37 you realize you said "convergent" when you meant "divergent." Now you either re-record the whole thing, splice audio in a video editor, or just live with the mistake.

The narration is trapped in a media file. You can't diff it, version-control it, or re-render just the slide you changed. And if you want to update one figure six months later? Back to the recording studio (i.e., your office with the door closed and a hope that nobody knocks).

What I wanted was something more like compiling code: text in, video out. Edit the source, rebuild, get a new artifact. Version-control the source, not the binary.

## Enter SlideSonnet

[SlideSonnet](https://github.com/avivz/slideSonnet) is the tool I built for this. You write your slides in [MARP](https://marp.app/) Markdown or LaTeX Beamer, add narration as comments in the source, and run a build command. Out comes an MP4 with synthesized speech, timed to each slide, with subtitles.

The narration lives right next to the content it describes:

```markdown
# Euler's Theorem

Every connected graph has an Eulerian circuit
if and only if every vertex has even degree.

<!-- say: This is one of the oldest results in
     graph theory. Euler proved it in 1736, motivated
     by the famous Königsberg bridge problem. -->
```

Edit one slide's narration, rebuild, and only that slide's audio gets re-synthesized. Switch TTS backends without changing your slides. Chain modules together via a playlist file. The whole thing is designed around the idea that lecture content should be as easy to iterate on as source code.

Here's an example — a presentation about the Basel Problem, built in conversation with Claude and compiled by SlideSonnet:

<div class="video-embed">
<iframe src="https://www.youtube.com/embed/IkzeCoDuU5o" allowfullscreen></iframe>
</div>

## My entry into vibe coding

SlideSonnet is itself largely "vibe-coded" — built in conversation with Claude. And that was deliberate. I wanted to try vibe coding on a real project, not a toy demo, and SlideSonnet turned out to be the perfect candidate.

Why? Two reasons:

**It's a real project with a real use case.** I actually need this tool. It solves a genuine problem I face as a lecturer. That matters because the interesting questions about vibe coding don't surface when you're building a to-do app — they surface when you hit real-world complexity: edge cases in FFmpeg encoding, subtitle timing drift, caching logic that needs to handle partial rebuilds.

**It's low risk.** This is key. SlideSonnet isn't a real-time system where a bug means downtime. It's not handling user data or financial transactions. There are no significant security concerns — it reads Markdown files and produces videos. If the code has an inelegant corner or an unnecessary abstraction, nobody gets hurt. The worst case is a build that fails, and you re-run it. For a first serious vibe-coding project, you want exactly this profile: real enough to be interesting, forgiving enough that imperfect code is fine.

The experience confirmed much of what people say about vibe coding, and added some nuance. The pipeline is conceptually straightforward (parse slides → synthesize speech → compose video → concatenate), but the details are fiddly: FFmpeg incantations, TTS API quirks, content-hash caching, incremental builds, and this complexity means you cannot just get there in one shot.

Where it gets interesting is the management of processes and feedback loops. Vibe coding isn't just "describe a feature, get code." It's an iterative conversation where you change the code, add procedures to make it robust, review yourself, seek review and advice from Claude, and refine as you slowly start to understand what it is you are building. The speed of that process, along with the existence of a coding peer who is in many ways more knowledgeable and faster than me, is what makes it feel like a truly different experience compared to writing code alone. The process ended up resembling a startup building an MVP — setting a roadmap, doing UX review, adding CI and testing to increase robustness. I got to use tools I'd long been aware of but never had the time to learn: CI on GitHub, deployment to PyPI, and more. I have many thoughts about the process itself that I will probably share in a separate note further down the road.

## AI voices and the uncanny valley

A lecture compiler is only as good as its voice. Early TTS systems were clearly robotic — nobody would mistake them for a human. Then neural TTS started climbing out of the uncanny valley, producing speech that sounds remarkably natural in short bursts. The current generation (ElevenLabs, OpenAI's TTS, and others) can be genuinely pleasant to listen to.

But "climbing out of the uncanny valley" isn't a one-way trip. There's a peculiar phenomenon where AI speech sometimes *slips back in* — you're listening, it sounds perfectly natural, and then something goes slightly wrong. An emphasis lands on the wrong word. A pause is a beat too short. The intonation on a rhetorical question is flat. It's subtle enough that you can't always articulate what's off, but you *feel* it. For a ten-second demo clip this rarely matters. For a forty-minute lecture, these micro-slips accumulate.

SlideSonnet supports multiple TTS backends partly for this reason. For drafting and iteration, the free local engine ([Piper](https://github.com/rhasspy/piper)) is fine — it's fast and costs nothing. For final renders you'd share with students, a premium API like [ElevenLabs](https://elevenlabs.io/) produces noticeably better results. I expect this entire tier to keep improving rapidly, and the tool is designed so that swapping backends is trivial.

The deeper question is whether students will tolerate AI narration at all, or whether the human voice carries something essential for engagement. I don't have a good answer yet — I suspect it depends heavily on the content and the alternatives. A well-paced AI narration of a clear explanation might beat a rushed, mumbling human recording. We'll see.

Like many technological advances, this is a double-edged sword. Used well — to free up class time for real interaction with and between students — tools like this can make education more personal, not less. Used poorly, they become another layer of distance, disconnecting students from the humans who are supposed to be teaching them. The tool doesn't decide which way it goes. We do.

## The Basel Problem: generate, then verify

The video above is a presentation about the Basel Problem — the story of how Euler proved that

$$\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$

The presentation was itself vibe-coded — not generated in one shot, but shaped through conversation. I asked Claude to simplify certain sections, expand others, adjust the tone. The MARP Markdown format is natural for this kind of back-and-forth — just structured text with math notation and narration annotations, no visual layout to hallucinate. The result is a 31-slide presentation covering the full historical arc: Mengoli posing the problem in 1650, Bernoulli's public admission of defeat, Euler's brilliant proof by factoring $\sin(x)/x$ as an infinite product, with multiple voices including a "Bernoulli" for the historical quotes.

Getting from zero to a finished video was harder than I expected. Pronunciation was a particular struggle — mathematical terms, historical names, and especially so because I was simultaneously experimenting with a Hebrew narration version. I hope and expect this part of the process will get smoother over time.

The result was good — coherent narrative, correct proof structure, reasonable pacing. But was it *accurate*?

## Fact-checking an AI-generated lecture

I made the verification process deliberate. First, I had Claude extract every verifiable claim from the presentation into an explicit list — dates, quotes, mathematical identities, biographical facts. Then I launched parallel verification tracks: symbolic computation (SymPy) for the mathematical claims, web searches for the historical facts, with a requirement to provide links and references for every single claim. Where sources disagreed, I pushed for primary sources.

Out of twenty claims, seven needed corrections — the kinds of mistakes a well-read person would make from memory. Plausible details that turn out to be slightly wrong. The resulting [fact-check report](https://github.com/avivz/slideSonnet/blob/main/examples/basel-problem/fact-check.md) is fascinating in its own right — it reads like a detective story of tracing claims back to their sources. It's shipped with [SlideSonnet](https://github.com/avivz/slideSonnet) along with the corrected presentation.

The lesson is architectural: **generate, then verify, using different capabilities than the ones used to generate.** The initial draft drew on pattern-matched training data. The verification used tool-augmented research — web lookups, symbolic math, primary source tracing. The two modes have different failure patterns, which is exactly what makes the combination useful.

*Fair warning: SlideSonnet is still an unstable alpha undergoing major changes. Use with caution, but if you do, drop me a note and tell me what to improve!*
