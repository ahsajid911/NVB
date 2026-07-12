# HealthNav BD — UI/UX & Bug-Fix Spec

A working brief compiled from a review of the current build (public site, doctor search, doctor profile, admin dashboard, admin profile). Grouped by **bugs**, **flow/architecture changes**, and **visual redesign**, in priority order.

---

## 1. Bugs (fix first — these break trust in the product)

### 1.1 Search bar typing issue
The homepage/hero search input has a typing glitch (cursor jumps, characters lag, or input loses focus while typing — confirm which). Likely causes: a controlled input re-rendering on every keystroke, a debounce firing a state reset, or an autofocus/animation conflict on the input. Fix by isolating the input's state so parent re-renders don't reset it.

### 1.2 Header search button navigates to the wrong page
Clicking the top-right **Search** icon/button in the header currently auto-navigates somewhere unintended instead of opening a search UI or going to `/doctors?q=...`. Wire it to either:
- Expand an in-place search overlay, or
- Route to `/doctors?query=<term>` with the typed term pre-filled.

### 1.3 Frontend/backend data mismatch
You suspect the DB has a bad "extra location" entry that's corrupting fetch/display. Action items:
- Audit the `locations`/`districts` table for duplicate or malformed rows (e.g. via the admin Export Data CSV).
- Add validation on the import/seed script so malformed rows can't be inserted again.
- Confirm doctor/hospital records reference valid `district_id` foreign keys — orphaned references are a common cause of blank fields downstream.

### 1.4 Profile page shows empty fields
`/admin/profile` (My Profile) currently renders **Username, Email, Role, Member Since, Last Login** all as blank dashes (`—`), and Full Name/Bio/Phone/Email are empty inputs with only placeholder text. This means the profile GET request isn't populating the form, or the API isn't returning the logged-in admin's actual record. Fix:
- Confirm `/api/admin/profile` (or equivalent) returns real data for the session.
- Pre-fill all fields from that response instead of leaving them as placeholders.
- Add a loading skeleton instead of showing empty dashes while the fetch is in-flight, so it doesn't look broken.

### 1.5 Admin sidebar links don't load real tables
Clicking **Doctors**, **Hospitals**, **Specialties**, **Districts** in the admin sidebar should open a full data table (list, search, edit, delete rows) — not just show the counts that already appear on the Overview tab. These need actual CRUD table views built out.

---

## 2. Flow / architecture changes

### 2.1 Sticky header
The top navigation bar should be `position: sticky; top: 0` (or fixed) with a background/blur so it stays visible on scroll, on both the public site and inside the admin panel.

### 2.2 Merge "Symptom Assistant" and "AI Symptom Check"
These are currently two separate nav items/buttons doing the same or overlapping job, which is confusing. Decide on one name (suggest **"AI Symptom Check"** — clearer to a non-technical user) and:
- Remove the duplicate nav link and duplicate hero button.
- Point every entry point (nav, hero CTA, floating "AI Health Guide" button) to the same single flow.
- If the two currently use different logic/backends, consolidate into one endpoint so results are consistent.

### 2.3 Admin session shouldn't break on navigation
Right now, clicking the logo/home link from inside the admin panel appears to kick you out of the admin session entirely. Instead:
- Keep the admin session alive independently of navigating to the public site.
- Clicking "view site" or the logo from admin should open the public homepage in a **new tab**, leaving the admin panel/session untouched in the original tab.

### 2.4 Clickable contact info on doctor profile
On the doctor detail page, make Contact Information interactive:
- Phone number → `tel:+8801711001027` (opens dialer on mobile, dialer app prompt on desktop)
- Email → `mailto:doctor@email.com` (skip rendering if "Not available")
- Location/hospital address → `https://maps.google.com/?q=<address>` (opens Google Maps)

Style these as tappable rows with icons and a subtle hover/press state so it's obvious they're actionable, not plain text.

---

## 3. Visual redesign direction

**Goal:** move from "functional dashboard" to a premium, Apple-level feel — generous whitespace, soft depth, restrained color, purposeful motion.

### Header & buttons
- Rebuild the header with a translucent/blurred background (`backdrop-filter: blur`) over the dark hero so it feels layered, not just a solid navy bar.
- Reduce button clutter: the hero currently repeats **Symptom Assistant / Find a Doctor / Find a Hospital** twice (once in header, once as big buttons). Keep the header versions small/secondary and let the big CTAs live only in the hero.
- Primary buttons: one consistent blue, medium-weight shadow, subtle scale-up (1.02–1.03x) and shadow-lift on hover, 150–200ms ease-out transition.

### Color grading
- Keep the deep navy hero but tighten the palette to 2–3 core colors (navy, one accent blue, neutral gray/white) rather than mixed card tints (blue/green/orange/purple stat cards on the admin dashboard feel inconsistent with the rest of the app). Use one accent color with varying opacity/tint instead of four different hues.
- Use consistent corner radii (e.g. 12–16px) and consistent shadow elevation across cards, inputs, and buttons.

### Motion (subtle, not flashy)
- Fade+slide-in on hero content on load.
- Card hover: slight lift (translateY -2px) + shadow increase.
- Page transitions: simple 150ms fade between routes.
- Skeleton loaders (shimmer) instead of blank/empty states while data fetches — this alone will fix a lot of the "looks broken" feeling from the empty profile page.

### Doctor cards / list
- Add doctor photo placeholders with initials on a soft gradient (already partly done) — keep, but make the accent color rotate by specialty for quick visual scanning.
- Make the whole card clickable (currently unclear if only the name is a link).

### Mobile optimization
- Header collapses to a hamburger menu with a slide-in drawer below ~768px.
- Hero search input and stat cards stack full-width.
- Doctor filter sidebar (Specialty/District/Gender/Fee/Sort) becomes a bottom-sheet "Filters" modal on mobile instead of a permanent left column.
- Ensure tap targets are ≥44px for all buttons/inputs (dialer/mail/map links especially, since these are core mobile actions).
- Test admin panel sidebar on mobile — it should also collapse to a drawer, not stay pinned at 280px.

---

## Suggested build order
1. Fix profile data fetch + admin table CRUD views (2.5, 1.5) — these are "data is missing" bugs, highest trust impact.
2. Fix search bar typing + header search routing (1.1, 1.2).
3. Sticky header + merge Symptom Assistant/AI Symptom Check (2.1, 2.2).
4. Admin session persistence (2.3).
5. Clickable contact info (2.4).
6. Visual redesign pass + mobile optimization (Section 3) last, once functionality is solid.
