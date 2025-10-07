# Landing-to-Calculator User Journey

This guide captures how a guest arriving on the Marxia landing page reaches the external order calculator, then maps every UX touchpoint back to the codebase for fast audits and updates.

## 1. End-user walkthrough
1. **Arrival on landing page (`index.html`)** – The header presents a persistent "Ordena" link plus quick preference toggles for language and theme, assuring guests they can switch contexts before acting.【F:index.html†L42-L84】
2. **Primary call to action** – The gallery section anchors an "Ordena ahora" button that deep-links to the ordering experience, while the contact section repeats the same CTA for reinforcement.【F:index.html†L165-L178】
3. **Transition to order page (`order.html`)** – Selecting any "Ordena" CTA loads the order interface with hero messaging, a primary "Order now" button, and the secondary ghost button dedicated to the calculator.【F:order.html†L84-L105】
4. **Footer shortcut** – The landing page footer mirrors the calculator access with a "calculator" link adjacent to the copyright line, routing visitors straight to the Worker in a secure tab.【F:index.html†L190-L201】
5. **Invoking the calculator** – Pressing "Abrir calculadora" spawns a new browser tab pointed at the configured Worker (`/calc`), giving shoppers a focused estimation surface without leaving the storefront.【F:order.html†L92-L103】【F:src/js/calculator.js†L49-L66】

## 2. Source-of-truth mapping

| File | Lines | Purpose |
| --- | --- | --- |
| `index.html` | 42–84 | Header, navigation, and preference toggles that frame the landing experience before conversion CTAs.【F:index.html†L42-L84】 |
| `index.html` | 165–178 | Dual "Ordena ahora" CTAs that route visitors toward the transactional funnel.【F:index.html†L165-L178】 |
| `index.html` | 190–201 | Footer calculator link that keeps the Worker experience one click away from the landing page.【F:index.html†L190-L201】 |
| `order.html` | 84–105 | Hero layout containing both the primary order action and the calculator trigger button (`#openCalc`).【F:order.html†L84-L105】 |
| `src/js/calculator.js` | 1–72 | Button wiring: resolves the Worker endpoint, disables the control if no URL is present, and programmatically opens the calculator in a sandboxed tab.【F:src/js/calculator.js†L1-L72】 |
| `src/js/i18n/dictionary.js` | 50–52, 311–313 | Localized labels and aria text for the calculator action, ensuring consistency across languages and assistive tech.【F:src/js/i18n/dictionary.js†L50-L52】【F:src/js/i18n/dictionary.js†L311-L313】 |

> **Compliance cue:** The calculator launches with `rel="noopener noreferrer"` to maintain PCI-DSS aligned isolation between the storefront and the external calculation service, reducing shared-context risk.【F:src/js/calculator.js†L32-L45】
