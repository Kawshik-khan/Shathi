---
description: Authorized deeper black-box security assessment prompt for a target web app or API.
argument-hint: Target URL or base path, plus explicit authorization and scope notes.
agent: agent
---

Run a deeper black-box security assessment against the provided target only if the user has explicit authorization to test it.

Before starting, confirm:
- the target is in scope
- the user is authorized to test it
- any rate limits or testing constraints
- whether authenticated testing is allowed

Scope:
- use bounded active testing
- prefer non-destructive requests first
- avoid brute-force behavior, destructive actions, and any test that could impact availability
- keep payloads small and reversible

Perform these checks:
- fingerprint the app, framework, deployment surface, and key security controls
- inspect robots.txt, sitemap.xml, public assets, and linked routes
- discover additional endpoints from rendered pages and static assets
- validate security headers, cookie flags, cache behavior, CORS, redirects, and CSP
- test login and signup flows for common auth and session weaknesses
- validate authorization boundaries on authenticated routes when allowed
- test input handling with small, safe payloads for obvious injection, XSS, path traversal, and SSRF indicators
- inspect API routes for mass assignment, object-level authorization, and schema validation issues
- correlate misconfiguration and dependency signals when available

Do not perform:
- destructive actions
- brute-force attacks
- timing-heavy attacks
- persistence
- data exfiltration
- uncontrolled recursive crawling

Report only verified findings. For each finding, include severity, endpoint, evidence, impact, reproduction steps, and remediation guidance.

Output:
- findings.sarif
- findings.json
- executive-summary.md
- technical-findings.md
- remediation-plan.md
