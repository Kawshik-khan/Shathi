---
description: CI-only black-box security regression check for a target web app or API.
argument-hint: Target URL or base path, plus optional known auth/API routes and scope notes.
agent: agent
---

Run a CI-safe black-box security regression check against the provided target.

Scope:
- stay read-only by default
- use only bounded, non-destructive requests
- avoid browser automation, aggressive crawling, recursive fuzzing, brute force, and timing attacks
- focus on reproducible CI signals rather than deep exploitation

Perform these checks:
- fingerprint the app, framework, and deployment surface
- inspect robots.txt, sitemap.xml, and public assets
- discover a small endpoint set from the base URL and known links
- validate security headers, cookie flags, cache behavior, CORS, and redirect handling
- run lightweight auth and authorization regression checks on configured routes
- detect obvious secret exposure and weak client-side configuration in static assets
- correlate known misconfiguration and dependency signals when available

Report only verified findings. For each finding, include severity, endpoint, evidence, impact, and remediation guidance.

Output:
- findings.sarif
- findings.json
- executive-summary.md
- technical-findings.md
- remediation-plan.md
