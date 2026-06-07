---
layout: project
title: "AuditPay"
subtitle: "Anonymous payments with a bounded, hidden audit"
collaborators:
  - name: Elkana Tovey
    url: https://elkanatovey.github.io
  - name: Yossi Gilad
    url: https://www.cs.huji.ac.il/~yossigi/
  - name: Aviv Zohar
    url: https://www.avivz.net
tags: [blockchain, privacy, mixers, auditing, zero-knowledge, ethereum]
papers:
  - title: "AuditPay: Anonymous Payments with Controlled Oversight (ePrint 2026/1118)"
    url: https://eprint.iacr.org/2026/1118
---

Blockchain mixers like Tornado Cash give users real privacy: you deposit coins from one address and withdraw them to another, and no one can tell which deposit funded which withdrawal. That property is also exactly what makes regulators nervous — the U.S. Treasury sanctioned Tornado Cash in 2022 over money-laundering concerns (a decision a court later overruled). **AuditPay** is an attempt to find a middle ground that doesn't collapse into "no privacy for anyone." It lets a designated auditor link the deposits and withdrawals of a *bounded* set of monitored addresses, while every other user keeps the same privacy a plain mixer gives them — and crucially, users can't tell whether they're the ones being watched. The paper is on [ePrint](https://eprint.iacr.org/2026/1118) and accepted to CCS 2026.

## What's wrong with the existing compromises

The usual way to add oversight to a privacy system is a *viewing key*: the user hands a key to an auditor, who can then read that user's transactions. Monero and Zcash support this. It has two problems we found hard to live with.

First, asking for the key tells the user they're under scrutiny — which is enough for a careful target to change behavior, or to simply refuse and move to a jurisdiction the auditor can't reach. Second, there's no built-in limit. An auditor can quietly request viewing keys from arbitrarily many users without anyone seeing how wide the dragnet is. Viewing keys give the auditor too much, too silently.

Other proposals lean on trust assumptions instead of cryptography: a committee of validators that's secure only under an honest majority, a "privacy budget" enforced by permissioned validators, or a compliance-as-a-service provider who decides which addresses are allowed in. If the honest-majority assumption fails, or the provider is compromised or coerced, the privacy guarantee for *everyone* fails with it.

We wanted something with a different shape: the auditor's power is capped by cryptography, the cap is public, and which addresses are being watched stays hidden — all without adding a trusted party beyond standard cryptographic assumptions.

## The guarantee, stated plainly

AuditPay works in epochs (say, an hour or a day). At the start of each epoch the auditor fixes a set `S` of addresses it wants to monitor, of size at most a public budget `|V|`. Then:

- **If neither end of a deposit–withdrawal pair is in `S`**, the auditor learns nothing — the pair is as unlinkable as in a plain mixer.
- **If either the depositing or the receiving address is in `S`**, the auditor can link that deposit to that withdrawal.
- **No one — not users, not outside observers — can tell which addresses are in `S`.** The only public fact is the budget's size `|V|`.

The budget is the point. Because `|V|` is published and enforced cryptographically, an overreaching auditor can't just monitor everyone; it has to spend its budget on the addresses it actually suspects. A user who isn't a target is mathematically guaranteed the mixer's full privacy, and a user who *is* a target can't detect it and adjust.

## How it works

A plain mixer is an append-only Merkle tree of deposit commitments; to withdraw, you prove in zero knowledge that you own some unspent deposit, without revealing which one. AuditPay keeps that structure and adds two pieces.

**Selective encryption.** From any address you can derive an *audit key*. The trick (a short Diffie–Hellman–style construction over an elliptic curve) is that data encrypted under an address's audit key can be decrypted *only* by someone who holds the auditor's secret for that specific address. At withdrawal time, the user is forced — by the mixer's zero-knowledge proof — to encrypt the link between their deposit and withdrawal under the audit keys of *both* the sending and receiving addresses. If either address is monitored, the auditor decrypts and learns the link. If neither is, the ciphertext is indistinguishable from random noise and reveals nothing.

**An audit-key vector that hides the monitored set.** The naive way to support many monitored addresses is to make each withdrawal encrypt its metadata once per monitored address — but that makes transaction size and gas cost grow linearly with the budget, which is hopeless at the scale of thousands of addresses. Instead, the auditor encodes its whole monitored set into a single public *audit-key projection vector* `V`. Any address can be mapped, via a fixed set of hash functions, to a linear combination of entries in `V`. The auditor constructs `V` (by solving a system of linear equations over the curve) so that this combination yields the real audit key for a monitored address — and a value indistinguishable from random for everyone else. So `V` is public, its size reveals the budget, but it leaks nothing about *which* addresses are encoded in it.

The five-step protocol, end to end: (1) the auditor publishes `V` off-chain and commits to it on-chain; (2) a user deposits funds plus a commitment bound to their address; (3) to withdraw, the user submits a zero-knowledge proof along with the two ciphertexts and a nullifier; (4) the mixer verifies and releases the funds; (5) the auditor reads the withdrawal's ciphertexts and decrypts them — successfully only if one of the addresses is in `S`.

## What it costs

We implemented AuditPay by extending Tornado Cash v2.0.0 on Ethereum, with the zero-knowledge proofs written in Circom (Groth16 over the BabyJubJub curve) and the auditor's vector construction in C++. The overheads are modest:

- **Deposits** cost about 4% more gas than Tornado Cash — one extra hash to bind the depositor's address to the note.
- **Withdrawals** cost about 32% more gas (≈410K vs. ≈310K), driven by the larger zero-knowledge proof.
- **Gas is independent of the budget.** Because each withdrawal commits to the whole vector with a single public input, monitoring 10 addresses and monitoring 40,000 cost the user the same on-chain.
- **Generating a withdrawal proof** takes under 30 seconds on a laptop, and grows only *logarithmically* with the auditing budget — so large budgets stay practical for users.
- **The auditor's** work is the heavy end: building the vector grows roughly cubically with the budget. Monitoring 40,000 addresses takes about an hour on a 100-core machine. For scale, the OFAC sanctions list holds roughly 18,500 addresses — well within range for an auditor with serious hardware, which is the party that can afford it.

The naive per-address approach, by contrast, would need around 87M gas (≈86× Tornado Cash) to support a 40,000-address budget. Folding the whole set into one vector is what makes the scheme usable.

## Limitations

A few things AuditPay deliberately does not do, and one inherent weakness worth being upfront about:

- **Monitoring recipients in an open mixer is evadable.** Anyone can mint a fresh, never-seen address for each incoming payment, so a careful target can dodge recipient-side monitoring. Monitoring *depositor* addresses is stronger — the auditor watches an address sending funds *into* the mixer and follows where they go next — but recipient-side oversight only really bites when a target is forced to publish a receiving address (a darknet vendor advertising a wallet, say). This is a property of open, no-KYC systems, not a fixable bug in our scheme.
- **No retrospective linking.** AuditPay links deposits and withdrawals as they happen, within the current epoch. It does not let an auditor go back and trace funds that were already withdrawn to an unmonitored address in the past. Supporting that would require the mixer to retain and selectively reveal extra historical data; we leave it to future work.
- **Sybil spam is only partially addressed.** An adversary can create many addresses hoping some escape the budget. A registration fee per address raises the cost, and in practice a single linkage is often enough to start unravelling a target's transaction graph — but this isn't a hard guarantee.

The trust story is the part we're most happy with: AuditPay's privacy rests only on standard cryptographic assumptions (hardness of discrete log / decisional Diffie–Hellman, and a sound zero-knowledge proof system) — no honest-majority committee, no trusted compliance gatekeeper that can be compromised or compelled into breaking everyone's privacy at once.
