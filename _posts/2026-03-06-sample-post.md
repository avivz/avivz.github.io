---
layout: post
title: "On the Surprising Depth of Selfish Mining"
subtitle: "A revisit of incentive compatibility in proof-of-work blockchains"
date: 2026-03-06
tags: [blockchain, game-theory, research]
---

In 2013, Ittay Eyal and I showed that Bitcoin's mining protocol is not incentive compatible. A miner controlling more than a third of the network's hash power could earn disproportionate rewards by *withholding* newly found blocks — a strategy we called **selfish mining**.

A decade later, this result continues to surface in unexpected places. Here are a few things I've been thinking about.

## The core intuition

The honest mining strategy says: whenever you find a block, publish it immediately. This feels right — why sit on value? But the blockchain is a race, and information is a weapon.

> A selfish miner who withholds a block forces honest miners to waste work on a stale chain. When the selfish miner finally reveals, they've gained a head start.

The math works out because the attacker turns **variance** into **advantage**. Every moment an honest miner works on the wrong chain tip is pure profit for the attacker.

![Optimal selfish mining strategies](/images/OptimalSelfishMining.jpg)

## The revenue model

Let $\alpha$ denote the attacker's fraction of total hash power, and $\gamma$ the fraction of honest miners who mine on the attacker's block during a fork (a measure of network connectivity advantage). The expected relative revenue of a selfish miner is:

$$
R_{\text{selfish}}(\alpha, \gamma) = \frac{\alpha(1 - \alpha)^2(4\alpha + \gamma(1 - 2\alpha)) - \alpha^3}{1 - \alpha(1 + (2 - \alpha)\alpha)}
$$

For honest mining, revenue is simply $R_{\text{honest}} = \alpha$. Selfish mining is profitable when $R_{\text{selfish}} > \alpha$, which occurs when:

$$
\alpha > \frac{1 - \gamma}{3 - 2\gamma}
$$

In the worst case for the attacker ($\gamma = 0$), the threshold is $\alpha > 1/3$. With perfect connectivity ($\gamma = 1$), it drops to $\alpha > 0$ — *any* amount of hash power can profit from the strategy.

## Why it still matters

Three reasons this keeps coming up:

1. **New protocols, same traps.** Proof-of-stake systems, DAG-based protocols, and rollup sequencers all face variants of the same information-withholding problem.

2. **MEV changes the game.** Maximal Extractable Value means that block content — not just block *existence* — is strategically valuable. Withholding isn't just about racing anymore.

3. **Composability creates new surfaces.** When protocols interact (bridges, shared sequencers, cross-chain MEV), the strategy space explodes in ways we're only beginning to map.

## A small experiment

I ran some simulations comparing the original selfish mining strategy against a few adaptive variants. The code is straightforward:

```python
def simulate_selfish_mining(alpha, gamma, rounds=100000):
    """
    alpha: attacker's fraction of hash power
    gamma: fraction of honest miners that mine on attacker's block during a fork
    """
    attacker_blocks = 0
    honest_blocks = 0
    private_chain = 0

    for _ in range(rounds):
        if random() < alpha:
            private_chain += 1
        else:
            if private_chain == 0:
                honest_blocks += 1
            elif private_chain == 1:
                # Race condition
                if random() < gamma:
                    attacker_blocks += 1
                else:
                    honest_blocks += 1
                private_chain = 0
            else:
                attacker_blocks += private_chain
                private_chain = 0

    return attacker_blocks / (attacker_blocks + honest_blocks)
```

The simulation confirms the analytical result: for $\alpha = 0.35$ and $\gamma = 0.5$, the selfish miner earns roughly $0.38$ of all blocks — a $\approx 8.6\%$ gain over the honest baseline. The variance across runs is itself interesting — it suggests that in practice, short-horizon miners might not adopt the strategy even when it's theoretically optimal.

## What's next

I'm working on extending this analysis to a multi-miner setting where several strategic miners coexist. Consider $n$ miners with hash powers $\alpha_1, \dots, \alpha_n$ where $\sum_i \alpha_i = 1$. Each miner $i$ chooses a strategy $s_i \in \mathcal{S}$. The key question becomes whether a Nash equilibrium exists in which all miners play honestly, i.e.:

$$
\forall i: \quad R_i(\text{honest}, s_{-i}^*) \geq R_i(s_i, s_{-i}^*) \quad \forall s_i \in \mathcal{S}
$$

More on this soon.

---

*This is a sample blog post. It references real research but the "experiment" above is illustrative, not a published result.*
