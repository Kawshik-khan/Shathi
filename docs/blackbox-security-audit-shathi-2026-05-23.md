# Black Box Security Audit Report

Target: https://shathi.vercel.app
Date: 2026-05-23
Mode: authorized active assessment with bounded checks

## Executive Summary

This was an authorized black-box assessment focused on public exposure, security headers, and safe auth surface validation.

Verified findings:
- 3 low-severity issues
- No critical or high issues were confirmed
- No obvious client-side secrets or API keys were visible in the rendered HTML

## Scope and Method

Checks performed:
- Public landing page inspection
- robots.txt and sitemap.xml discovery
- Auth route inspection for /auth/login and /auth/signup
- Header review on public responses
- Static HTML secret exposure scan

Checks not performed:
- Aggressive crawling
- Recursive fuzzing
- Brute-force testing
- Timing attacks
- Destructive or state-changing actions

## Verified Findings

### 1. robots.txt and sitemap.xml are not published

Severity: Low

Evidence:
- https://shathi.vercel.app/robots.txt returned 404
- https://shathi.vercel.app/sitemap.xml returned 404

Impact:
- Search engines and automated security tools have no explicit crawl guidance or sitemap metadata.
- This reduces discoverability for benign automation and makes public route mapping less structured.

Remediation:
- Add a robots.txt file.
- Add a sitemap.xml file for public pages.
- Keep both aligned with the intended public surface.

### 2. Security header hardening is uneven across public routes

Severity: Low

Evidence:
- Homepage response did not include Strict-Transport-Security in the verified response headers.
- /auth/login and /auth/signup did include Strict-Transport-Security.
- The verified auth responses also returned Access-Control-Allow-Origin: * and cacheable public responses.

Impact:
- Header policy is inconsistent across routes.
- The mismatch weakens a simple, uniform security baseline and can complicate CI regression checks.

Remediation:
- Apply a consistent security header policy across all public routes.
- Review whether Access-Control-Allow-Origin: * is needed on auth pages.
- Confirm cache policy is appropriate for login and signup surfaces.

### 3. Login API returns HTTP 500 for invalid credentials

Severity: Low

Evidence:
- OPTIONS on /api/backend-auth/login returned 204 with Allow: OPTIONS, POST
- POST /api/backend-auth/login with invalid credentials returned 500
- Response body was {"detail":"Login failed"}

Impact:
- The auth backend is exposed and accepts POST on a public endpoint.
- Invalid credentials are handled as a server error instead of a controlled authentication failure.
- This weakens reliability and can complicate client-side handling and monitoring.

Remediation:
- Return a proper authentication failure status such as 401 or 400 for invalid credentials.
- Keep the response body generic.
- Add regression coverage for invalid-login behavior so the endpoint does not drift back to 500.

## Verified Public Routes

- /
- /auth/login
- /auth/signup

## Additional Notes

- No cookies were set during anonymous browsing.
- No obvious secrets, API keys, or bearer tokens were visible in the rendered HTML.
- The target appears to be a Next.js app deployed on Vercel.
- The login flow calls /api/backend-auth/login directly from the client.

## Conclusion

The public surface looks generally clean for a bounded active pass. The main verified improvements are crawler metadata exposure, route-level header consistency, and proper error handling on the login API.
