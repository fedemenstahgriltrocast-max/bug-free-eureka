# Marxia Café y Bocaditos Repo Audit

## Overview
This audit captures the current front-end experience (`index.html` and `order.html`), shared styling (`main.css`), the interaction layer (`main.js`), and the Cloudflare Worker (`workers-directory/sequence-worker.js`). It highlights strengths, gaps, and a remediation roadmap aligned with NIST CSF, CISA Cyber Essentials, and PCI DSS practices.

## Excellent
- **Structured metadata and SEO hygiene** – Pages include canonical, robots, localized alternate links, and JSON-LD schema, supporting discoverability and multilingual readiness.【F:index.html†L3-L42】【F:order.html†L3-L42】
- **Accessibility touchpoints** – Skip links, aria labels, and responsive navigation controls are consistently provided across landing and order experiences.【F:index.html†L45-L88】【F:order.html†L45-L135】
- **Robust interaction scaffolding** – `main.js` centralizes state for cart, i18n, theming, carousel, drawers, and FAB menus with guards to avoid null dereferences on pages that do not expose all widgets.【F:main.js†L1-L143】【F:main.js†L952-L1034】【F:main.js†L1233-L1388】
- **Edge security enforcement** – The Cloudflare Worker strips hop-by-hop headers, applies strict security headers, enforces payload integrity, and controls CORS, aligning with PCI DSS requirements for secure transmission.【F:workers-directory/sequence-worker.js†L1-L120】

## Great
- **E-commerce readiness** – Order page exposes a complete carousel, cart summary, delivery chips, and payment drawer with synchronized totals and localization hooks, setting a solid base for future transactional flows.【F:order.html†L126-L508】【F:main.js†L236-L626】
- **Theme and language persistence** – Preferences respect `localStorage`, `prefers-color-scheme`, and update UI labels/ARIA states dynamically for both quick toggles and FAB menus.【F:main.js†L200-L389】【F:main.js†L640-L781】
- **Security messaging and compliance posture** – UI copy references PCI DSS, NIST CSF, and CISA in footers, reinforcing trust cues and policy alignment.【F:index.html†L171-L182】【F:order.html†L698-L705】

## Good
- **Performance-minded media usage** – Images leverage `loading="lazy"`, explicit dimensions, and `referrerpolicy="no-referrer"`, helping Core Web Vitals and privacy.【F:index.html†L104-L165】【F:order.html†L152-L404】
- **Reusable styling tokens** – `main.css` defines design tokens (colors, shadows, radii) and adapts them for dark mode, aiding consistency and scalability.【F:main.css†L1-L88】
- **Drawer ergonomics** – Drag-and-drop drawers on desktop, inert attributes, and keyboard handling (`Escape`, focus restoration) improve usability and accessibility.【F:main.js†L892-L1232】

## Bad
- **Monolithic client script** – `main.js` packs disparate concerns (i18n, cart, carousel, drawers, storage) into a single 1,300+ line IIFE, reducing maintainability and auditability for future PCI DSS and secure SDLC reviews.【F:main.js†L1-L1390】
- **Default copy mismatched to locale** – Despite `lang="es"`, several visible strings render in English before JavaScript runs, undermining accessibility, SEO, and non-JS experiences (e.g., "Order now", "Breakfasts, pastries & catering in Guayaquil").【F:order.html†L54-L96】
- **External asset dependency without redundancy** – Critical imagery loads from `twilight-glade-ca07.distraction.workers.dev`; an outage or DNS shift would break the visual brand and degrade UX.【F:index.html†L108-L164】【F:order.html†L162-L404】
- **No manifest or service worker** – Pages omit PWA scaffolding (`manifest.json`, service worker registration) despite mobile-first design goals, limiting offline readiness and install prompts (PCI DSS Req. 6 change management also benefits from explicit assets).【F:index.html†L3-L42】

## Worse
- **Lack of runtime input validation** – Chat form, cart adjustments, and prospective checkout lack client-side validation or rate-limiting hooks, opening avenues for malformed submissions when backend endpoints are added (PCI DSS Req.6.5).【F:order.html†L623-L694】【F:main.js†L430-L626】
- **Missing consent and privacy controls** – No GDPR/CCPA consent banner, privacy policy link, or cookie preference center is present, impeding compliance expectations for handling customer data (NIST PR.AC/PR.IP).【F:index.html†L44-L185】【F:order.html†L44-L709】
- **Observability gaps** – Front-end lacks telemetry hooks (no SIEM/monitoring integrations), and sitemap references production domain without automated updates, obstructing the Detect function (NIST DE.CM).【F:robots.txt†L1-L4】【F:sitemap.xml†L1-L8】

## Remediation Plan
1. **Refactor interaction layer (Great ➔ Excellent)**
   - Break `main.js` into ES modules (cart, i18n, UI controls) bundled with a modern build step; add unit tests for price math and localization switching. Supports PCI DSS Req.6 secure coding and simplifies code review cadence.
2. **Localize static markup (Good ➔ Great)**
   - Provide Spanish defaults in HTML, use `data-i18n` only for runtime swaps, and extend translations to worker error messages. Update copy deck and verify with accessibility scans.
3. **Asset resilience (Bad ➔ Good)**
   - Host media on first-party CDN/S3 with versioned URLs; keep Cloudflare Worker as signed proxy fallback. Document supply-chain checks per NIST ID.SC.
4. **PWA and consent foundations (Worse ➔ Good)**
   - Add `manifest.json`, register a service worker with offline caching strategy, implement cookie/privacy banners, and surface privacy policy footer links. Aligns with CISA guidance and PCI DSS Req.12 policy disclosures.
5. **Security hardening (Worse ➔ Great)**
   - Introduce client-side validation, CAPTCHA or rate limiting for chat/payment intents, instrument front-end logging to SIEM, and ensure sitemap/robots auto-generate during CI to prevent stale references. Schedule semi-annual penetration tests focusing on new flows.
6. **Governance and monitoring (Cross-cutting)**
   - Create a governance dashboard mapping components to NIST/CISA/PCI controls, define release procedures in repo docs, and add automated Lighthouse/axe scans in CI for continuous compliance feedback.

## Next Steps
- Prioritize localization fixes and consent tooling in the upcoming sprint to address compliance blockers.
- Plan a refactor epic for Q3 focusing on modular JS, telemetry, and PWA enablement.
- Engage security/DevOps stakeholders to integrate worker logs with centralized monitoring and document incident response drills.
