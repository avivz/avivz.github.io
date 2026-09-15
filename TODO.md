# Website TODO

> This file is excluded from the Jekyll build (see `exclude:` in `_config.yml`),
> so it is committed to the repo but never published to GitHub Pages.

## Publications to update

- [ ] **AuditPay** (Tovey, Gilad, Zohar — CCS 2026): currently linked to the ePrint
      full version (https://eprint.iacr.org/2026/1118). Check whether the CCS 2026
      camera-ready / ACM DL version is out, and if so add the ACM link + DOI and a
      local `pubs/2026/auditpay.pdf`.
- [ ] **AetherWeave** (Alpturer, Doumanidis, Zohar — SBC 2026): currently linked to
      the arXiv preprint (https://arxiv.org/abs/2603.23793). Check whether the SBC 2026
      camera-ready / proceedings version is out, and if so add the proceedings link.
- [ ] **Personality questionnaires via LLMs** (Monsa, Zohar, Arzy — iScience 2026,
      doi:10.1016/j.isci.2026.116909): local PDF added at
      `pubs/2026/personality_questionnaires_llm.pdf`. Still to do: fill in
      volume/issue in the BibTeX once the article is assigned to an issue.

## Hosting / infrastructure

- [ ] **HTTPS enforcement on GitHub Pages** (noted 2026-09-15): `https://avivz.github.io/`
      301-redirects to plain `http://www.avivz.net/`, and only then does Cloudflare bounce
      to HTTPS. GitHub's "Enforce HTTPS" checkbox is unavailable because the domain is
      Cloudflare-proxied (`is_https_eligible: false` in the Pages health check), so this
      is a dashboard change, not a repo change. Pick one:
      - **Keep Cloudflare proxy** (easier): in the Cloudflare dashboard confirm
        "Always Use HTTPS" is on, SSL mode is "Full", and enable HSTS (site currently
        sends no `Strict-Transport-Security` header).
      - **Move TLS to GitHub**: set both DNS records to DNS-only (grey cloud) —
        `www` CNAME → `avivz.github.io`, apex A → 185.199.108/109/110/111.153 — wait for
        GitHub to issue a cert, then tick "Enforce HTTPS" in Settings → Pages.
