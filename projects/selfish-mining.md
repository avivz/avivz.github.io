---
layout: project
title: "Selfish Mining and Protocol Incentives"
subtitle: "Analyzing incentive compatibility in proof-of-work blockchains"
collaborators:
  - name: "Ittay Eyal (Technion)"
    url: https://ittayeyal.github.io/
tags: [blockchain, game-theory, mining]
papers:
  - title: "Majority is Not Enough: Bitcoin Mining is Vulnerable (FC 2014)"
    url: /pubs/2015/btc_ghost.pdf
  - title: "Optimal Selfish Mining Strategies in Bitcoin (FC 2016)"
    url: /pubs/2016/OptSelfishMining.pdf
links:
  - title: "Selfish Mining Simulator (GitHub)"
    url: https://github.com/example/selfish-mining-sim
---

## Overview

Bitcoin's Nakamoto consensus relies on miners following the protocol honestly — publishing blocks as soon as they are found. We showed that this assumption is flawed: a strategic miner can gain disproportionate revenue by selectively withholding blocks.

This line of work examines the game-theoretic foundations of proof-of-work mining and asks: **under what conditions is honest mining a Nash equilibrium?**

## Key Results

### The Selfish Mining Attack

A miner with hash power $\alpha > 1/3$ can deviate from the honest strategy and earn more than their fair share of rewards. The attack works by maintaining a private chain and selectively revealing blocks to waste honest miners' effort.

The revenue of a selfish miner is:

$$
R(\alpha, \gamma) = \frac{\alpha(1 - \alpha)^2(4\alpha + \gamma(1 - 2\alpha)) - \alpha^3}{1 - \alpha(1 + (2 - \alpha)\alpha)}
$$

where $\gamma$ captures the attacker's network connectivity advantage.

### Optimal Strategies

We later showed that selfish mining is not itself optimal — there exist Markov Decision Process (MDP) policies that extract even higher revenue. Using a state-space formulation with states $(a, h, \text{fork})$ representing the attacker's lead, the honest chain length, and whether a fork is active, we computed optimal strategies via linear programming.

![Optimal strategies for selfish mining](/images/OptimalSelfishMining.jpg)

### Implications for Protocol Design

These results have practical consequences:

- **Difficulty adjustment** can amplify the advantage of strategic miners
- **Network topology** matters — well-connected miners benefit more
- **Block size** and propagation delays interact with mining incentives
- The threshold $\alpha > 1/3$ can be lowered with protocol modifications

## Current Directions

We are currently exploring:

1. **Multi-miner games** — What happens when several miners are strategic simultaneously?
2. **MEV and content-based strategies** — How does transaction ordering value change the game?
3. **Cross-chain mining** — Strategic behavior when miners operate across multiple chains

## Related Talks

A presentation on this work is available on the [talks page](/talks.html).
