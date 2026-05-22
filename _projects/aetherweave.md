---
layout: project
title: "AetherWeave"
subtitle: "Stake-backed peer discovery"
status: active
collaborators:
  - name: Kaya Alpturer
    url: https://kalpturer.github.io/
  - name: Constantine Doumanidis
    url: https://cedarctic.github.io/
  - name: Aviv Zohar
    url: https://www.avivz.net
tags: [blockchain, p2p, peer-discovery, sybil-resistance, ethereum, privacy]
papers:
  - title: "AetherWeave: Sybil-Resistant Robust Peer Discovery with Stake (arXiv)"
    url: https://arxiv.org/abs/2603.23793
links:
  - title: "Prototype (Prysm fork and staking contract)"
    url: https://github.com/CedArctic/aetherweave-artifact
  - title: "Event-driven simulator"
    url: https://github.com/CedArctic/aetherweave_simulator
---

Blockchains spend a lot of effort making consensus-layer identities expensive — stake, mining rigs, deposits. The peer-discovery layer right underneath usually doesn't. That gap leaves nodes exposed to eclipse and Sybil attacks before consensus even has a chance to do its job. **AetherWeave** is a peer-discovery protocol that ties network participation to deposited stake, making large-scale attacks expensive while keeping each node's network identity unlinkable from its on-chain deposit. The paper is on [arXiv](https://arxiv.org/abs/2603.23793) and accepted to SBC 2026.

## The gap between consensus and discovery

When a new Ethereum node comes online, it needs to find peers. It contacts a bootstrap node, asks for a list of IP addresses, and starts connecting. How does the new node know the bootstrap is not malicious and feeding it only attacker-controlled peers?

It doesn't, really. Nodes today can become *eclipsed* — their view of the network controlled by an attacker who can hide blocks, deliver stale data, or partition the network into pieces that disagree about reality. Eclipse attacks against [Bitcoin](https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/heilman) and [Ethereum](https://eprint.iacr.org/2018/236) have been demonstrated in real systems. They work because creating new network identities is essentially free. An attacker with a few thousand IPs can flood the discovery process with bogus entries and crowd out the real ones. Current defenses — IP subnet bans, rate limits, reputation tracking — partially mitigate the problem but don't deter a well-provisioned attacker.

Meanwhile, Ethereum has *already solved* the free-identity problem one layer up. Proof-of-stake ensures consensus representation is proportional to stake; the consensus layer is Sybil-resistant by design. The network layer right underneath it is not. The natural question: can we use staked identities at the network layer too?

## Stake-backed peer discovery

The basic idea: every node in the discovery network backs its participation with a stake deposit. Misbehavior — for example, sending more requests than the protocol allows — produces a publicly verifiable proof that anyone can use to slash the offender's deposit. That puts a real cost on Sybils: an attacker who wants 10,000 fake nodes has to lock the stake for 10,000 of them.

The pieces we needed to build on top of that idea:

1. An actual discovery protocol — how nodes find each other, how new nodes bootstrap, how the system handles peers leaving and rejoining with new addresses.
2. A way for a node to prove stake ownership without revealing *which* deposit it owns. Showing stake ownership is easy with zero-knowledge proofs of set membership. The hard part is making this coexist with slashing, which requires that when a node misbehaves, anyone in the network can point at the offender's deposit and burn it. That looks like a direct contradiction of unlinkability — you need to know who they are to slash them. Most of the design effort here is reconciling the two: honest nodes stay fully unlinkable, but the moment a node breaks the rules, the misbehavior itself leaks just enough information to identify exactly which deposit to slash.
3. A way to *detect* when an attacker is trying to partition the honest network, so that even if an attack succeeds, victims don't silently keep operating in a compromised state.

## The protocol sketch

Each node in AetherWeave keeps two peer tables, each of size $s\sqrt{n}$, where $n$ is the number of staked nodes and $s$ is a small constant (we use $s=4$ in experiments). One table is used for *gossip* — exchanging peer records with others. The other is used to draw the node's actual *overlay* connections from. The two tables are populated using independent private seeds, so what a peer learns by gossiping with you tells them nothing about your overlay neighbors.

Each round, every node does roughly the same thing:

- It picks a fresh pseudorandom *slice* of the staked network.
- It asks each peer in its gossip table for any records matching that slice.
- Each responder filters its own table by the requester's slice and returns the matching records — only $s^2$ records in expectation, which is why bandwidth stays small.
- Each record contains the responder's network public key, a recent zero-knowledge proof that the key is backed by a real stake deposit, and a signed network address.

The key observation: the slice is chosen by the *requester*, not the responder. So a malicious responder can't pad their answer with extra adversarial records — those wouldn't match the slice and would be rejected. The only attack available to a malicious responder is *suppression* — silently dropping honest records that should have matched. And suppression has a fingerprint: if a node receives many fewer records than the protocol predicts, that's a statistical signal that something is off.

That signal drives the eclipse-detection mechanism. If a node's table comes out too sparse, the node raises a local flag. In a real deployment this could trigger switching bootstrap peers, alerting an operator, or pausing RPC operations until the table looks healthy.

## Guarantees

Our central result is about *partitioning* the honest network. Informally: suppose an adversary controls some fraction $\alpha$ of the stake, knows every honest node's private seeds, and can drop arbitrary messages between honest nodes; and suppose each node's expected overlay degree grows like $\Omega(\log n)$. Then with overwhelming probability, for every way the adversary tries to split the honest nodes into two groups, either some node on one side has an overlay connection to the other (so the partition fails), or a large fraction of the smaller side raises the eclipse-detection alarm. In other words: against the strongest adversary we could write down, a successful partition is highly visible.

We also have a mean-field analysis giving a closed-form picture of when the gossip layer converges. The condition is

$$s^2(1 - \alpha) > 1,$$

which says, roughly, that the rate at which honest records spread has to beat the rate at which silent or adversarial nodes drop them. With $s = 4$ this tolerates $\alpha < 15/16$ adversarial stake before the gossip layer breaks.

## Privacy

Naively, tying network participation to stake is a privacy regression — every node's IP becomes linkable to a specific validator deposit. We avoided this.

A node's network public key is derived deterministically from the same secret that controls its stake deposit, but you cannot go from the network key back to the deposit without breaking the underlying zk-proof system. When a node serves peer records, it includes a fresh zk-proof saying *"this network key is backed by some deposit in the staking contract"*, without saying which one. A peer table looks like a list of pseudonyms with fresh stake proofs, not a list of validators with their IPs.

Unlinkability holds *only as long as a node behaves honestly*. The slashing mechanism works by requiring each request to carry a cryptographic share of a slashing secret tied to a bounded commitment to the requester's full set of intended recipients that round. If a node ever issues two batches with different commitments in the same round — which is what request spam requires — anyone who sees both shares can reconstruct the slashing secret, identify the offending deposit, and burn it. Honest behavior keeps the shares apart; dishonest behavior glues them together and gives up your identity.

A subtle point: the slice seed has to stay private from individual responders, otherwise an adversarial responder learns what the requester is looking for and learns something about their table. One way to achieve this is to evaluate the slice predicate inside a TEE so the responder's host never sees the requester's seed. That's what lets responses stay small ($s^2$ records). A trust-free alternative is private information retrieval, which removes the hardware assumption at a bandwidth cost — sending responses roughly the size of the responder's table rather than $s^2$. So the $O(s\sqrt{n})$ communication cost and the TEE assumption are coupled.

## The prototype

We forked [Prysm](https://github.com/OffchainLabs/prysm) and replaced its discovery layer with AetherWeave, with a Solidity staking contract and Circom/Groth16 stake and slashing proofs verified off-chain. Code and a separate Python event-driven simulator are on GitHub: [aetherweave-artifact](https://github.com/CedArctic/aetherweave-artifact), [aetherweave_simulator](https://github.com/CedArctic/aetherweave_simulator).
