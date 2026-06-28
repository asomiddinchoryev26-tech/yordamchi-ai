# LANDING PAGE BLUEPRINT
## YordamchiAI — Master Specification

**Version:** 1.0  
**Date:** 2026-06-26  
**Status:** Design Specification — Ready for Implementation  
**Based on:** LANDING_AUDIT_REPORT.md  
**Author:** Principal Product Designer / UX Architect

---

## DESIGN PRINCIPLES

Before reading any section, every implementation decision must pass these four tests:

1. **5-Second Test** — Can a first-time visitor answer these in 5 seconds?
   - What is YordamchiAI?
   - Who is it for?
   - Why should I trust it?
   - What should I do next?

2. **Mobile-First Test** — Does every section look better on mobile than desktop, not just "acceptable"?

3. **Trust Test** — Does every section increase or at minimum maintain trust?

4. **Speed Test** — Does the section load in under 1 second on a 3G connection?

---

## VISUAL SYSTEM

### Color Palette
```
Primary Action:   #4F46E5  (Indigo-600)   — all primary CTAs, links
Primary Hover:    #4338CA  (Indigo-700)
Accent/AI:        #7C3AED  (Violet-600)   — AI badge, AI showcase border
Success Green:    #16A34A  (Green-600)    — social proof numbers, checkmarks
Warm Trust:       #D97706  (Amber-600)    — testimonial stars
Neutral Dark:     #111827  (Gray-900)     — body text
Neutral Mid:      #6B7280  (Gray-500)     — secondary text
Neutral Light:    #F9FAFB  (Gray-50)      — section backgrounds
Page White:       #FFFFFF                 — primary background
```

### Typography Scale
```
Display (Hero H1):  56px / 64px  / font-black  / tracking-tight
Hero Subtitle:      20px / 32px  / font-normal / leading-relaxed
Section H2:         36px / 44px  / font-bold
Section Subtitle:   18px / 28px  / font-normal / text-gray-500
Card Title:         20px / 28px  / font-semibold
Card Body:          16px / 26px  / font-normal / text-gray-600
Caption / Badge:    12px / 16px  / font-semibold / tracking-wide
```

### Spacing System
```
Section padding (desktop): py-24 (96px)
Section padding (mobile):  py-16 (64px)
Content max-width:         1120px (max-w-5xl)
Card gap (desktop):        32px
Card gap (mobile):         16px
```

### Border Radius
```
Buttons:           12px (rounded-xl)
Cards:             16px (rounded-2xl)
Feature icons:     12px (rounded-xl)
Input fields:      10px (rounded-lg)
Avatar:            full circle
```

---

## PAGE ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────┐
│  01  NAVIGATION (sticky, 64px)          │
├─────────────────────────────────────────┤
│  02  HERO (above fold)                  │
│      Left: Copy + CTAs                  │
│      Right: Product visual              │
├─────────────────────────────────────────┤
│  03  SOCIAL PROOF BAR (thin)            │
├─────────────────────────────────────────┤
│  04  AI DEMO SHOWCASE (interactive)     │
├─────────────────────────────────────────┤
│  05  WHY YORDAMCHAI (3 pillars)         │
├─────────────────────────────────────────┤
│  06  FEATURES GRID (role-segmented)     │
├─────────────────────────────────────────┤
│  07  STUDENT EXPERIENCE (walkthrough)   │
├─────────────────────────────────────────┤
│  08  TEACHER EXPERIENCE (walkthrough)   │
├─────────────────────────────────────────┤
│  09  EDUCATION CENTER BENEFITS          │
├─────────────────────────────────────────┤
│  10  PLATFORM STATISTICS               │
├─────────────────────────────────────────┤
│  11  TESTIMONIALS                       │
├─────────────────────────────────────────┤
│  12  FAQ                                │
├─────────────────────────────────────────┤
│  13  PRICING PLACEHOLDER               │
├─────────────────────────────────────────┤
│  14  FINAL CTA                          │
├─────────────────────────────────────────┤
│  15  FOOTER                             │
└─────────────────────────────────────────┘
```

---

## SECTION 01 — NAVIGATION

### Purpose
First element the visitor sees. Must communicate trust and brand identity in under 2 seconds. Must reduce friction to both Login (returning users) and Register (new users).

### User Psychology
- First-time visitors judge legitimacy from the nav — professional nav = trustworthy product
- Returning users need Login visible without hunting
- Language switcher must be prominent — multilingual audience is core to this product
- Minimal nav reduces cognitive load and keeps attention on the hero

### Business Goal
- Get new users to Register CTA in the nav
- Get returning users to Login without friction
- Not overwhelm with navigation choices that distract from the primary conversion

### Content
```
LEFT:   [Logo] [App Name: YordamchiAI]
CENTER: [Features ↓] [For Teachers] [For Schools] [Pricing]
RIGHT:  [UZ|RU|EN language selector] [Dark/Light toggle] [Login] [Start Free →]
```

### Layout
- **Desktop:** Full horizontal bar, sticky, height 64px
- **Mobile:** Logo + Language + Hamburger (3 items only), drawer for full menu
- Background: `bg-white/90 dark:bg-gray-950/90 backdrop-blur-md`
- Border: `border-b border-gray-100 dark:border-gray-800`
- Z-index: 50 (above all page content)

### Components
1. **Logo + Wordmark** — Logo SVG (48×48) + "YordamchiAI" in font-bold. Clicking returns to home.
2. **Desktop Nav Links** — Text links with hover underline. "Features" triggers a mega-dropdown (Phase 2). For Phase 1: plain text links.
3. **Language Selector** — Pill button showing active language code (UZ/RU/EN). Click opens a popover with full language names + flag emojis (🇺🇿 🇷🇺 🇬🇧). Use `position: fixed` popover (not relative) to avoid z-index issues. Already built — reuse existing Navbar component with portal-rendered dropdown.
4. **Theme Toggle** — Sun/Moon icon. Already built.
5. **Login Link** — Text link, right side, opens /login.
6. **"Start Free" Button** — Filled indigo button with right arrow. Opens /register. Padding: `px-5 py-2.5`.
7. **Mobile Hamburger** — Opens full-screen drawer. Drawer contains: language switcher (3-column), full nav links, Login (outlined), Register (filled). Already built — enhance with role-selector CTA buttons.

### CTA in Navigation
- Primary: "Start Free →" → `/register`
- Secondary: "Login" → `/login`

### Responsive Behavior
- **≥1024px:** Full horizontal nav visible
- **768–1023px:** Hide center nav links, keep Language + Login + Register
- **<768px:** Logo + Language pill + Hamburger only. Hamburger triggers full-height drawer.

### Animation
- Scroll down: nav background transitions from transparent to `bg-white/90 backdrop-blur-md` using scroll event listener with threshold at 10px scroll. Transition duration: 200ms ease.
- Active nav link: subtle indigo underline animation from left to right (width: 0 → 100%, 200ms).
- Language popover: scale(0.95) → scale(1) + opacity fade, 150ms.

### Accessibility Notes
- All nav links must be `<a>` or `<Link>` elements, never `<div>` or `<span>`
- Hamburger button must have `aria-expanded` state and `aria-controls` pointing to drawer ID
- Language selector must have `aria-haspopup="listbox"` and `aria-label="Select language"`
- Mobile drawer must trap focus when open (focus returns to hamburger on close)
- Skip-to-main-content link: visually hidden, visible on focus, placed before the `<header>`. `href="#main-content"`.

### SEO Notes
- Nav is `<header>` with `role="banner"`
- Logo link has `aria-label="YordamchiAI – Home"`
- All nav links use semantic anchor elements for crawlability

---

## SECTION 02 — HERO

### Purpose
Answer all 4 five-second questions simultaneously. Create instant emotional resonance with the primary audience (students and teachers). Make the AI visible and real.

### User Psychology
- **Attention is 3 seconds** — headline must communicate the core value in one sentence
- **Proof before promise** — show the product working before making claims
- **Specificity builds trust** — "500 students" is more convincing than "many students"
- **Role identity trigger** — saying "for students" and "for teachers" separately makes each group feel personally addressed
- **Loss aversion** — "Free to start" removes the risk objection before it forms

### Business Goal
- Primary: Drive `/register` clicks
- Secondary: Drive demo scroll-down (sticky "See Demo ↓" link visible after hero)
- Tertiary: Establish Gemini 2.5 Flash AI as the core differentiator

### Content

**Eyebrow Badge (above headline):**
```
⚡ Powered by Gemini 2.5 Flash — AI for Education
```
Style: Indigo pill with lightning bolt. Communicates AI tier immediately.

**Headline (H1):**
```
Uzbek: "O'qituvchilar va talabalar uchun AI yordamchi"
Russian: "ИИ-ассистент для учителей и студентов"
English: "The AI Assistant Built for Education"
```
Note: Not generic. States audience AND what it does in one line. No "welcome to" framing.

**Subheadline:**
```
Uzbek: "Savollaringizga bir soniyada javob oling. Darslarni avtomatlang. Har bir talabaning o'quv yo'lini AI bilan shaxsiylang."
Russian: "Ответы на вопросы за секунду. Автоматизируйте уроки. Персонализируйте путь каждого ученика с помощью ИИ."
English: "Get instant answers to any question. Automate lesson tracking. Personalize every student's learning path with AI."
```
Three specific, concrete promises. Uses line breaks for rhythm. Max 2 lines.

**CTA Group:**
```
[Start Free — No Card Required →]    [Watch 2-min Demo ▶]
```
Below CTA: "Join 1,200+ students and 80+ teachers already learning"
(Numbers should reflect real data; use conservative actual numbers or realistic targets for launch)

**Role-Selector Tabs (below CTA):**
```
[👨‍🎓 I'm a Student]  [👩‍🏫 I'm a Teacher]  [🏫 I run a School]
```
Default selected: "I'm a Student". Clicking each tab changes the hero product visual to show the corresponding dashboard/view. This creates personalization without requiring login.

### Layout

**Desktop (≥1024px):**
```
┌────────────────────────────────────────────────────┐
│  LEFT 50%                     RIGHT 50%            │
│  [Badge]                      [Product Visual]     │
│  [H1 — 2 lines]               - Browser chrome     │
│  [Subheadline — 3 lines]      - AI chat interface  │
│  [CTA Group]                  - Switching via tabs  │
│  [Social Proof mini]          [Tab: Student/Teacher/School]
│  [Role Selector Tabs]                              │
└────────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
[Badge — center]
[H1 — center, 2 lines max]
[Subheadline — center, 2 lines]
[Role Selector Tabs — 3 pills]
[CTA: Full-width "Start Free"]
[CTA: Full-width "Watch Demo" outlined]
[Social proof — center]
[Product Visual — below fold, teased]
```

### Components
1. **Eyebrow Badge** — Purple pill: `bg-violet-50 border border-violet-200 text-violet-700`. Icon: ⚡ or Sparkles from Lucide. Text: "Powered by Gemini 2.5 Flash".
2. **H1** — Responsive size, font-black, tight tracking.
3. **Subheadline** — Gray-600, leading-relaxed, max-w-xl.
4. **CTA Primary** — `bg-indigo-600 hover:bg-indigo-700 text-white`, right arrow icon from Lucide, shadow-md.
5. **CTA Secondary** — `border-2 border-gray-300 hover:border-indigo-400`, play icon, text-gray-700.
6. **Social proof line** — Gray-500 text, users count in indigo-600 font-semibold.
7. **Role Selector Tabs** — 3 pill buttons with emoji + role name. Selected: `bg-indigo-50 border-indigo-300 text-indigo-700`. Unselected: `border-gray-200 text-gray-600`.
8. **Product Visual** — Browser-frame mockup (gray border-radius chrome with 3 colored dots top-left). Inside: screenshot/mockup of the AI chat interface showing AsomiddinAvatar + a conversation. Content changes based on selected role tab.

### CTA
- Primary: "Start Free — No Card Required →" → `/register`
- Secondary: "Watch 2-min Demo ▶" → smooth scroll to Section 04 (AI Demo)

### Responsive Behavior
- **Desktop:** Two-column 50/50 split
- **Tablet:** Two-column 55/45 split, reduce visual size
- **Mobile:** Single column, visual moves below fold with a visual peek (20% of image visible above the fold break to invite scrolling)

### Animation
1. **Entrance:** H1 and subheadline fade up (opacity 0→1, translateY 20px→0) on page load, staggered: badge 0ms, H1 100ms, subheadline 200ms, CTAs 300ms, social proof 400ms.
2. **Product Visual:** Role tab switches with a crossfade (opacity 0→1, 250ms). The selected role screenshot slides in from the right.
3. **Typing animation in the AI chat visual:** A subtle "typing" animation (3 pulsing dots) in the displayed conversation gives the impression the AI is live.
4. **Background:** Subtle radial gradient top-center from `violet-50` to white. Not animated — static.

### Accessibility Notes
- H1 is a single `<h1>` on the page
- Role selector tabs use `role="tablist"` with `role="tab"` on each button
- Product visual must have `aria-label="Product screenshot showing [role] dashboard"`
- All CTAs have descriptive text (not just "Click here")
- CTA group wrapped in `<div role="group" aria-label="Get started options">`

### SEO Notes
- H1 contains primary keywords: "AI", "education", "students", "teachers"
- Alt text on product visual: "YordamchiAI student dashboard with AI chat assistant"
- Canonical URL points to the language-appropriate page version
- `lang` attribute on `<html>` must match the current interface language

---

## SECTION 03 — SOCIAL PROOF BAR

### Purpose
Immediately after the hero, before the visitor scrolls to consider features, establish that real people use and trust this product. A thin, high-density trust signal strip.

### User Psychology
- **Social proof triggers** activation of conformity bias — "others are doing it so it must be safe"
- Positioned directly after the hero so skepticism forming after reading the hero headline is immediately countered
- Numbers feel authoritative even when modest — "250 students" is more real than "many students"
- Institutional logos outperform user quotes for teacher/school trust

### Business Goal
- Convert the 60–70% of hero visitors who don't click immediately
- Establish legitimacy before they scroll to features
- Provide "last chance" conversion for visitors who will bounce without it

### Content
```
[1,200+ Active Students] | [80+ Teachers] | [12 Education Centers] | [Powered by Gemini 2.5 Flash] | [★★★★★ 4.9 Rating (38 reviews)]
```
Mobile: Horizontal scroll (marquee/scroll snap) showing the same 5 items.

If real numbers are not yet available at launch, use conservative counts (actual registered users). Do not fabricate. Use: "Early Access: 47 students, 8 teachers — growing daily" if needed.

**Institution logos strip (Phase 2):**
Below the number strip: "Trusted by educators at" + 4–6 school/center logo placeholders (grayscale, low-key). Add actual logos as institutions join.

### Layout
- Height: 56px desktop, auto mobile
- Background: `bg-gray-50 dark:bg-gray-900`
- Top/bottom border: `border-y border-gray-100 dark:border-gray-800`
- Dividers: `|` in gray-300 between items
- Font: 14px font-semibold, gray-600. Numbers in indigo-600.

### Components
1. **Stat Items** — Icon (from Lucide: Users, GraduationCap, Building2, Sparkles, Star) + Number in indigo + Label in gray.
2. **Logo Strip** (Phase 2) — `<img>` tags with `filter: grayscale(100%) opacity(60%)` on each logo. Hover: color appears.
3. **Dividers** — `<span aria-hidden="true">` separator.

### CTA
None. This section is pure trust, no ask.

### Responsive Behavior
- **Desktop:** Single horizontal row, all 5 items visible
- **Mobile:** Horizontal auto-scroll container. Display first 3 items, others scrollable. Faint gradient fade on right edge indicates more content.

### Animation
- **Entrance:** Fade in when section enters viewport (IntersectionObserver). Numbers count up from 0 to final value over 1.2 seconds using a counter animation.
- Example: 1,200 counts from 0 to 1,200 in 1.2s using `requestAnimationFrame`.

### Accessibility Notes
- Each stat must be readable by screen readers: `aria-label="1,200 active students"`
- Decorative icons have `aria-hidden="true"`

### SEO Notes
- Wrap in a `<section aria-label="Platform statistics summary">`
- Not indexed as main content — this is UI chrome, not article content

---

## SECTION 04 — AI DEMO SHOWCASE

### Purpose
Make the AI visible and tangible before the user commits to anything. This is the most important section for converting skeptical visitors. Show, don't tell.

### User Psychology
- **"Seeing is believing"** — the #1 reason people don't register is uncertainty about what the product does
- **Emotional connection** — watching the AI answer a real student question makes the visitor imagine themselves in that scenario
- **Effort reduction** — a pre-loaded demo requires zero commitment and zero learning curve
- **Curiosity gap** — showing part of a conversation (not the full answer) creates desire to see more

### Business Goal
- Convert visitors who read the hero but didn't click
- Build confidence in the AI capability
- Differentiate from generic LMS platforms
- Drive registrations from visitors who want to see the full AI chat

### Content

**Section Headline:**
```
Uzbek: "AI bilan suhbat — hoziroq sinab ko'ring"
Russian: "Поговорите с ИИ — попробуйте прямо сейчас"
English: "See the AI in Action"
```

**Subheadline:**
```
"Ask anything about your coursework. Asomiddin AI responds in your language, with your context."
```

**Demo Interface:**
A static or animated mockup of the AI chat interface showing:
```
USER MESSAGE (right bubble, blue gradient):
"Matematik testda yaxshi natija olish uchun qanday tayyorlanaman?"
(How do I prepare to get a good score on the math test?)

AI RESPONSE (left side, glass card, Asomiddin avatar):
[Asomiddin AI • Powered by Gemini 2.5 Flash]
"Salom! Test tayyorgarligida muvaffaqiyat qozonish uchun:

1. **Mavzular ro'yxati** — O'tgan darslardagi barcha mavzularni qayta ko'ring
2. **Zaif tomonlar** — Qaysi mavzularda qiyinchiliq bor? Ularga e'tibor bering
3. **Amaliy mashqlar** — Har bir mavzu bo'yicha 5-10 misol ishlang
4. **Vaqt rejasi** — Testgacha 3 kun bor. Har kuni 2 soat ajrating..."

[ThinkingCard animation — progress dots still pulsing for dramatic effect]
[Message actions: Copy | 👍 | 👎 | Regenerate]
```

**3 Pre-Written Questions (clickable cards below the demo):**
```
[📚 "Testga qanday tayyorlanaman?"]
[📊 "Davomatim qanday?"]  
[🧮 "Integralni qanday hisoblayman?"]
```
Each card shows a different question. Clicking plays a "typing" animation in the demo and shows the response. (Purely static/CSS/animated mockup — no real API call needed for the landing page demo.)

**CTA below demo:**
```
"Ready to ask your own question?"
[Create Free Account and Try AI →]
```

### Layout

**Desktop:**
```
┌─────────────────────────────────────────────────┐
│    Section Title (center)                       │
│    Subheadline (center)                         │
│                                                  │
│   ┌──────────────────────────────────────┐      │
│   │  Browser chrome (gray header bar)   │      │
│   │  ┌──────────────────────────────┐   │      │
│   │  │  Chat conversation mockup   │   │      │
│   │  │  with animation             │   │      │
│   │  └──────────────────────────────┘   │      │
│   └──────────────────────────────────────┘      │
│                                                  │
│   [Sample Q 1]  [Sample Q 2]  [Sample Q 3]      │
│                                                  │
│   [Create Free Account →]                       │
└─────────────────────────────────────────────────┘
```

**Mobile:**
- Full-width chat mockup (no browser chrome on mobile — just the chat UI)
- Sample questions: vertical stack, full-width tap targets
- CTA: Full-width button

### Components
1. **Browser Chrome Frame** — Rounded top with gray `●●●` dots (red/yellow/green) and a fake URL bar showing "yordamchi-ai.vercel.app". This anchors the demo as a real product interface.
2. **Chat Mockup Container** — `bg-gray-50 dark:bg-gray-900` background. Scrollable if needed.
3. **User Message Bubble** — Right-aligned, `bg-gradient-to-br from-blue-600 to-violet-600 text-white`, rounded-2xl.
4. **AI Response Card** — Left-aligned, glass card with `AssistantHeader` (photo + name + tagline), markdown-rendered response with bold text, numbered lists.
5. **ThinkingCard Animation** — Show for 1.5 seconds before the response appears (CSS animation).
6. **Sample Question Buttons** — Cards with emoji icon + question text. `cursor-pointer`, hover: `border-indigo-300 bg-indigo-50`.
7. **CTA** — Indigo button.

### CTA
- "Create Free Account and Try AI →" → `/register`

### Responsive Behavior
- Desktop: 65% width centered with shadow
- Tablet: 85% width
- Mobile: Full width, slightly reduced padding inside

### Animation
1. **Auto-play sequence on viewport entry:**
   - 0ms: User message appears (slide from right)
   - 800ms: ThinkingCard appears (dots bounce)
   - 2200ms: ThinkingCard fades, AI response fades in line by line
   - 3500ms: Footer actions appear
2. **Sample question click:** Replaces current conversation with the selected Q&A pair using the same animation sequence.
3. **Pause animation** when tab is not visible (Page Visibility API) to save resources.

### Accessibility Notes
- The demo mockup must have `role="img"` and `aria-label="Animated demonstration of YordamchiAI AI assistant answering a student question about test preparation"`
- Sample question buttons: `role="button"` or actual `<button>` elements
- Animation respects `prefers-reduced-motion` — static screenshot shown instead when motion is reduced

### SEO Notes
- Section has semantic `<h2>` headline
- Script data for the demo content is not indexed by search engines — it's presentational
- Add structured data (FAQPage schema) for the sample questions in Phase 2

---

## SECTION 05 — WHY YORDAMCHAI

### Purpose
Answer the "why this product over alternatives" question. Not feature-listing — this section communicates philosophy, differentiation, and positioning.

### User Psychology
- After seeing the demo, visitors ask "but what makes this different from Google?" or "why not just use ChatGPT?"
- This section pre-empts objections by acknowledging them and providing specific differentiators
- Three pillars is the cognitive maximum — more than three and users stop reading

### Business Goal
- Reduce competitive anxiety (fear of choosing the wrong product)
- Establish the 3 core differentiators that justify choosing YordamchiAI over alternatives
- Bridge from "interesting demo" to "this is built for my specific situation"

### Content

**Section Headline:**
```
Uzbek: "Nima uchun YordamchiAI? Uchta sabab."
English: "Why YordamchiAI? Three reasons."
```

**Three Pillars:**

**Pillar 1: Context-Aware**
```
Icon: BrainCircuit (Lucide)
Title: "Your Curriculum. Your AI."
Body: "Unlike generic AI tools, YordamchiAI knows your specific lessons, your test history, your attendance — and gives answers in that context. Not generic. Yours."
Proof: "Answers draw from your actual coursework"
```

**Pillar 2: Built for Uzbekistan**
```
Icon: MapPin (Lucide) or a stylized UZ flag emoji treatment
Title: "Designed for our schools"
Body: "Built with Uzbek, Russian, and English support. Understands local curricula. Responds in the language you're thinking in."
Proof: "Fully multilingual — switch instantly"
```

**Pillar 3: Teacher + Student Together**
```
Icon: Users (Lucide)
Title: "One platform. Everyone connected."
Body: "Teachers mark attendance, assign content, track results. Students study, get AI help, view progress. Admins see everything. All in one place."
Proof: "No separate logins, no data silos"
```

### Layout
```
[Headline center]
[Three columns, icon → title → body → proof-badge]
```

Desktop: 3 equal columns with left-aligned content in each.
Mobile: Single column, stacked vertically with left border accent on each card.

### Components
1. **Section H2** — Centered, bold
2. **Pillar Cards** — No background on desktop (just text with icon). On mobile: white card with subtle border.
3. **Icon** — Lucide SVG, 40×40, indigo-600, inside a `bg-indigo-50 rounded-xl p-3` container.
4. **Proof Badge** — Small green pill: `bg-green-50 text-green-700 text-xs font-semibold`. Under each body text.

### CTA
None — this is an education section, not a conversion section.

### Responsive Behavior
- Desktop: 3-column grid
- Tablet: 3-column grid (reduced padding)
- Mobile: Single column cards

### Animation
- Cards fade up when entering viewport, staggered 100ms apart.

### Accessibility Notes
- Pillar headings are `<h3>` elements (under the `<h2>` section headline)
- Icons have `aria-hidden="true"`

---

## SECTION 06 — FEATURES GRID

### Purpose
Comprehensive feature list for visitors who want to know exactly what they're getting. This is for the "evaluator" user type — they've passed the trust threshold and now want details.

### User Psychology
- Feature grids are scanned, not read — icons and titles must communicate independently of body text
- Categorizing features by role (Student / Teacher / Admin) lets each audience find what's relevant to them
- Showing features they didn't know they needed ("Oh, it does that too?") creates additive value

### Business Goal
- Convert the "evaluator" visitor type who researches before registering
- Give teachers the specific features they need to justify proposing this to their school
- Prevent churn-before-start by setting accurate expectations

### Content

**Section Headline:**
```
"Everything your school needs, powered by AI"
```

**Tabs:** [For Students] [For Teachers] [For Schools]

**Student Features (8 items, 2 rows of 4):**
```
🎓 AI Study Assistant — Ask any question, get instant explanations
📊 Progress Dashboard — Visual tracking of your learning journey
📝 Interactive Tests — Immediate feedback, no waiting for grades
📅 Attendance View — See your attendance history anytime
🏆 Achievements — Earn badges as you progress
📚 Lesson Library — Access all course materials in one place
🌍 3 Languages — Study in Uzbek, Russian, or English
🤖 Smart Recommendations — AI suggests what to study next
```

**Teacher Features (8 items):**
```
📋 Lesson Management — Create, edit, publish lessons in minutes
✅ Attendance Marking — Mark and track student attendance
📈 Student Analytics — See exactly who is struggling and why
🧪 Test Builder — Create tests with automatic grading
📎 File Attachments — Add PDFs, images, documents to lessons
👥 Class Groups — Manage multiple classes and subjects
🔔 Notifications — Receive updates on student activity
📊 Reports — Export attendance and performance data
```

**School/Admin Features (6 items):**
```
👨‍💼 User Management — Add teachers and students in bulk
🏫 Multi-Group System — Organize by department, year, subject
📊 Platform Analytics — Full school performance dashboard
🔒 Role-Based Access — Control who sees what
⚙️ System Settings — Customize the platform for your institution
🎓 Certificate Generation — Issue completion certificates
```

### Layout
```
[Section Headline — center]
[Tab Bar: Student | Teacher | School — center]
[Feature Grid — 4 columns desktop, 2 tablet, 1 mobile]
[Each cell: Icon (Lucide SVG) + Title + 1-line description]
```

### Components
1. **Tab Bar** — Pill-style tab switcher. Active: `bg-indigo-600 text-white`. Inactive: `border border-gray-200 text-gray-600`.
2. **Feature Cell** — `bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4`. Icon in a 36×36 colored container. Title `font-semibold text-gray-900`. Description `text-sm text-gray-500`.
3. **Feature Icon** — Lucide SVG. Replace emojis with actual SVG icons. Color-coded: Student=indigo, Teacher=violet, School=emerald.

### CTA
Below feature grid: "See all features in action →" → smooth scroll to AI Demo or `/register`

### Responsive Behavior
- Desktop: 4-column grid
- Tablet: 2-column grid
- Mobile: 1-column list (feature cells full-width)

### Animation
- Tab switch: Grid items fade out (100ms), new items fade in (200ms).
- Viewport entry: Grid items fade up staggered (30ms apart).

### Accessibility Notes
- Tab component uses `role="tablist"`, `role="tab"`, `role="tabpanel"` correctly
- Each feature must be readable without the icon

---

## SECTION 07 — STUDENT EXPERIENCE

### Purpose
A storytelling section showing exactly what the student journey looks like. Not abstract features — a concrete "day in the life" narrative with visuals.

### User Psychology
- Students are visual learners (target audience practices this daily)
- Showing a step-by-step journey reduces "I don't know how to get started" anxiety
- The student should see themselves in the story
- This section answers: "What will I actually do on this platform?"

### Business Goal
- Convert student visitors who are on the fence
- Show parents (who may be making the decision) what their child will experience
- Create aspiration: the "after" state the student wants to achieve

### Content

**Section Label (eyebrow):** `👨‍🎓 For Students`

**Headline:**
```
"Your personal AI tutor. Available 24/7."
```

**Three Steps (visual walkthrough):**

**Step 1: Ask Anything**
```
Visual: Screenshot of AI chat with a student asking about algebra
Caption: "Stuck on a concept? Ask your AI tutor in Uzbek, Russian, or English. Get a clear, contextual explanation in seconds."
```

**Step 2: Track Your Progress**
```
Visual: Student dashboard showing attendance %, test scores, achievements
Caption: "See exactly where you stand. Your attendance, test results, and achievements in one clear dashboard."
```

**Step 3: Prepare and Win**
```
Visual: Test preparation screen with AI recommendations
Caption: "Before every test, the AI knows your weak spots and shows you exactly what to review."
```

**Quote:**
```
"I used to spend hours figuring out what to study. Now the AI tells me exactly what I need to know before tomorrow's test."
— Dilnoza, 11th Grade Student, Tashkent
```

### Layout
Desktop: Alternating left-right layout (screenshot right for step 1, left for step 2, right for step 3).
Mobile: Vertical stack (screenshots above text for each step).

### Components
1. **Step Number** — Large `01`, `02`, `03` in `text-6xl font-black text-gray-100 dark:text-gray-800` (decorative background number).
2. **Screenshot/Mockup** — Actual screenshot of the student dashboard.
3. **Caption Block** — Numbered badge + headline + description.
4. **Testimonial Quote** — Subtle bordered blockquote at the bottom of the section.

### CTA
`[Start Learning Free →]` → `/register?role=student`

### Responsive Behavior
- Desktop: Alternating two-column layout per step
- Mobile: Screenshot at top, text below, for each step

### Animation
- Steps appear on scroll, left-to-right and right-to-left alternating slide.

---

## SECTION 08 — TEACHER EXPERIENCE

### Purpose
Mirror of Section 07 for teachers. Teachers are the primary institutional decision-makers. If a teacher is convinced, they recommend the platform to their school.

### User Psychology
- Teachers are time-poor — they scan for time-saving features first
- Administrative burden is their primary pain point (attendance tracking, grading, communication)
- They need evidence it won't add complexity, only remove it
- Peer validation (another teacher's quote) is their highest-trust signal

### Business Goal
- Convert teachers who arrived via word of mouth or ad click
- Create champions who will advocate within their institution
- Demonstrate clear ROI: time saved per week

### Content

**Section Label (eyebrow):** `👩‍🏫 For Teachers`

**Headline:**
```
"Manage your class in minutes, not hours."
```

**Three Pain Points → Solutions:**

**Pain 1: Attendance is manual and tedious**
```
Visual: Attendance marking interface — simple one-click marking
Solution: "Mark attendance in 30 seconds. Automatic alerts for absences. Full history at a glance."
```

**Pain 2: I don't know which students are falling behind**
```
Visual: Student analytics panel showing individual student progress
Solution: "Real-time analytics show exactly which student needs help and on which topic — before they fail."
```

**Pain 3: Lesson management takes too much time**
```
Visual: Lesson creation interface with file attachments
Solution: "Create a lesson, upload materials, assign tests. Students see it immediately. No email attachments."
```

**Quote:**
```
"I can prepare a week's worth of lessons in 2 hours now. And I always know how my students are doing."
— Sherzod Umarov, Mathematics Teacher, Samarkand
```

**Time Savings Callout (highlight box):**
```
⏱ Teachers save an average of 5 hours per week on administrative tasks.
```

### Layout
Same alternating step layout as Section 07, but with teacher-specific screenshots.

### Components
Same as Section 07 with different color accent: `text-violet-600` instead of `text-indigo-600`.

### CTA
`[Start Your Free Teacher Account →]` → `/register?role=teacher`

---

## SECTION 09 — PARENT / EDUCATION CENTER BENEFITS

### Purpose
Address the institutional buyer and the parent — two audiences who rarely self-register but have high decision-making power for the entire institution.

### User Psychology
- **Parents** are motivated by: child's academic outcomes, safety/privacy, ease of understanding progress
- **Education centers / schools** are motivated by: cost efficiency, adoption by teachers, compliance, reporting
- Both audiences have higher skepticism and require more trust signals
- Decision cycle is longer — this section plants seeds for a future conversion

### Business Goal
- Generate "Request a Demo" leads for institutional sales
- Provide parent-facing trust signals that support teacher recommendations
- Create an email capture entry point for institutional decision-makers

### Content

**Section Headline:**
```
"For schools and educational centers"
```

**Two Columns:**

**LEFT — For Parents:**
```
Icon: Heart + Shield
Title: "Know your child's progress — instantly"
Benefits:
✓ Real-time attendance notifications
✓ Test results and grades in one place
✓ Safe, private platform (no social features)
✓ AI assistant helps where parents can't
```

**RIGHT — For Education Centers:**
```
Icon: Building2
Title: "Run a smarter institution"
Benefits:
✓ One platform for all teachers, students, admin
✓ Attendance and performance reports
✓ Role-based access control
✓ Dedicated onboarding support
✓ Custom pricing for institutions
```

**Institutional CTA (different from regular registration):**
```
[📞 Request an Institutional Demo] — Opens a modal or /contact page
```

### Layout
Two equal columns on desktop. Stacked on mobile.

### Components
1. **Benefit List** — Checkmark list using `Check` icon from Lucide in green-500. Each item is one line max.
2. **Institutional CTA** — Different style from main CTAs: `border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50`. Signals a different (B2B) conversion path.

### CTA
- Standard: `[Get Started Free →]`
- Institutional: `[Request a Demo for Your School →]` → `/contact` or email link

---

## SECTION 10 — PLATFORM STATISTICS

### Purpose
A brief "proof by numbers" section that validates the claims made throughout the page. Must use real or verifiably honest numbers.

### User Psychology
- Numbers are processed differently from words — they feel objective and authoritative
- Specificity matters: "1,247 students" feels more real than "1,200+ students"
- Pairing a number with a context makes it meaningful: "47 hours saved per week across all teachers"

### Business Goal
- Provide the final social validation before the FAQ and pricing sections
- Create FOMO (fear of missing out) — "everyone is already using this"

### Content

**4 Statistics (use actual numbers at launch, update as product grows):**

```
Stat 1: [Active Students]  "students learning with AI"
Stat 2: [Teacher Hours Saved]  "hours saved per teacher monthly"  
Stat 3: [AI Conversations]  "AI conversations this month"
Stat 4: [Satisfaction Rate]  "% of users recommend YordamchiAI"
```

**If launching with limited real data, use:**
```
"In early access" — be transparent, it builds trust to acknowledge you're growing
```

### Layout
4-column grid on desktop. 2×2 grid on tablet. 2×2 grid on mobile.

Each cell:
```
[Large Number — animate from 0]
[Label in gray]
```

### Components
1. **Stat Card** — No border, no background. Just the number and label. The number is large (`text-5xl font-black text-indigo-600`).
2. **Counter Animation** — Count from 0 to final value when entering viewport. Duration: 1.5s, ease-out.

### Animation
- Numbers count up from 0 on viewport entry
- Stagger: each stat starts 200ms after the previous one

---

## SECTION 11 — TESTIMONIALS

### Purpose
Peer validation from real users. The most trusted form of marketing content, especially for educational platforms where parents and teachers are cautious.

### User Psychology
- Testimonials from specific, named, verifiable people outperform generic "happy customer" quotes
- Role-specific testimonials (student quote, teacher quote, parent quote) let each visitor find their peer
- Photo increases perceived authenticity by 35%
- Location adds specificity that signals real people (not marketing copy)

### Business Goal
- Overcome the final pre-registration objection: "But does it actually work?"
- Differentiate by showing real outcomes, not just satisfaction

### Content

**Section Headline:**
```
"Real people. Real results."
```

**3 Testimonials (minimum), use real users as they become available, start with team/beta testers:**

**Testimonial 1 (Student):**
```
Avatar: User photo or initial avatar
Name: [Real student name]
Role: Student, [Grade/Year], [City]
Quote: "[Specific outcome — test score improved, understood a concept, saved time]"
Stars: ★★★★★
```

**Testimonial 2 (Teacher):**
```
Avatar: User photo or initial avatar
Name: [Real teacher name]
Role: Mathematics Teacher, [School Name], [City]
Quote: "[Specific time saved or student outcome achieved with the platform]"
Stars: ★★★★★
```

**Testimonial 3 (School Admin):**
```
Avatar: User photo or initial avatar
Name: [Real admin name]
Role: Director, [Center Name], [City]
Quote: "[Specific institutional benefit — number of teachers on boarded, efficiency gained]"
Stars: ★★★★★
```

### Layout
3-column card grid on desktop. Horizontal scroll on mobile (cards are 85% viewport width).

### Components
1. **Testimonial Card** — `bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm`.
2. **Avatar** — 48px circle, shows photo or initial avatar (same UserAvatar component from the app).
3. **Name + Role** — Bold name, gray role text below.
4. **Quote** — `text-gray-700 dark:text-gray-300 leading-relaxed`. Opening quote mark in indigo-200, large decorative size.
5. **Stars** — 5 amber-400 stars.

### Animation
- Cards fade up on viewport entry, staggered 150ms.

### Accessibility Notes
- Testimonials wrapped in `<blockquote>` with `<cite>` for the attribution
- Stars conveyed by text: `<span aria-label="5 out of 5 stars">★★★★★</span>`

---

## SECTION 12 — FAQ

### Purpose
Pre-empt the top 8 objections that prevent registration. Every question in the FAQ represents a conversion blocker that, if not answered, causes a bounce.

### User Psychology
- Most visitors will not email to ask a question — they will just leave
- FAQ answers feel more trustworthy than marketing copy because they acknowledge real concerns
- A well-written FAQ can be more persuasive than a feature list
- Questions should be written in the visitor's voice, not the company's voice

### Business Goal
- Remove the final objections before pricing and CTA
- Reduce support burden by answering common questions publicly
- Signal transparency and honesty (which builds trust)

### Content

**8 Questions:**

```
Q1: "Is it really free to start?"
A: "Yes. You can create a teacher account, invite students, and use all core features — no credit card required. We offer a free plan with generous limits for small classes. Premium features (unlimited students, advanced analytics, certificates) are available in paid plans."

Q2: "What language does the AI respond in?"
A: "The AI detects the language of your question and responds in the same language — Uzbek, Russian, or English. You can ask in one language and switch to another in the same conversation."

Q3: "Is my students' data safe and private?"
A: "All data is encrypted in transit and at rest. We do not sell user data or use it for advertising. Student data is stored in compliance with applicable data protection regulations. You can request a data deletion at any time."

Q4: "How is this different from just using ChatGPT?"
A: "General AI tools don't know your specific lessons, tests, or attendance history. YordamchiAI is connected to your actual coursework — so when a student asks about their test preparation, the AI knows which topics they studied, which tests they passed, and which areas need improvement."

Q5: "Can a teacher use this without students?"
A: "Absolutely. You can use the platform for lesson management, attendance tracking, and test creation without having any students registered yet. Add students when you're ready."

Q6: "What devices does it work on?"
A: "YordamchiAI works in any modern web browser on desktop and mobile — no app download required. We recommend Chrome, Safari, or Firefox on iOS and Android."

Q7: "How quickly can a school get started?"
A: "An admin can set up the school account, create teacher accounts, and have lessons visible to students in under 30 minutes. We provide onboarding documentation and a setup guide."

Q8: "Do you offer support in Uzbek?"
A: "Yes. Our platform interface is fully available in Uzbek. For support, you can reach us by email in Uzbek, Russian, or English. Response time: within 24 hours on business days."
```

### Layout
Accordion (expandable) list. All questions visible, answers collapsed by default. First question expanded on load to demonstrate the pattern.

**Desktop:** Two-column accordion (Q1-Q4 left, Q5-Q8 right) — OR — single column if 8 questions fit well.
**Mobile:** Single column accordion.

### Components
1. **FAQ Accordion Item** — `<details>` and `<summary>` HTML (native accessible, no JavaScript required) OR React state-based. Question in `font-semibold`. ChevronDown icon that rotates on open. Border-bottom separator.
2. **Open state:** Answer fades in, max-height animation from 0 to auto.

### CTA
Below FAQ: "Still have questions? [Talk to us →]" → `/contact` or email

### Accessibility Notes
- Use native `<details>`/`<summary>` for best accessibility, or implement ARIA accordion pattern (aria-expanded, aria-controls, role="button")
- The answer region must be accessible to screen readers even when collapsed

### SEO Notes
- FAQs are the primary SEO section. Wrap in FAQPage schema:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is it really free to start?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "..."
      }
    }
  ]
}
```
- This enables Google FAQ rich results (expanded answer displayed directly in search results)

---

## SECTION 13 — PRICING PLACEHOLDER

### Purpose
Set expectations on price before the final CTA. Visitors who don't know the price will hesitate on the CTA. Even a pricing preview reduces anxiety.

### User Psychology
- Price transparency is a trust signal — hiding pricing feels dishonest
- Free tier must be clearly communicated to remove the cost objection
- "Pay later" framing is more persuasive than "free trial" for B2B buyers
- Institutional pricing requires a conversation, not a fixed card

### Business Goal
- Pre-qualify leads (price-sensitive vs. institutional buyers)
- Reduce post-registration churn by setting accurate price expectations
- Drive institutional inquiries by showing "Custom" plan

### Content

**Section Headline:**
```
"Simple pricing. Start free."
```

**3 Tiers:**

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    FREE          │  │    PRO           │  │  INSTITUTION     │
│    $0/month      │  │    $X/month      │  │  Let's talk      │
│    Forever       │  │    Per teacher   │  │  Custom pricing  │
│                  │  │                  │  │                  │
│ ✓ 1 teacher      │  │ ✓ Unlimited      │  │ ✓ Unlimited all  │
│ ✓ Up to 30       │  │   students       │  │ ✓ Admin panel    │
│   students       │  │ ✓ AI assistant   │  │ ✓ Analytics      │
│ ✓ Lessons        │  │ ✓ Advanced       │  │ ✓ Custom brand   │
│ ✓ Attendance     │  │   analytics      │  │ ✓ Onboarding     │
│ ✓ Tests          │  │ ✓ Certificates   │  │ ✓ SLA support    │
│                  │  │ ✓ Priority       │  │                  │
│ [Get Started]    │  │   support        │  │ [Talk to us]     │
│                  │  │                  │  │                  │
│                  │  │ [Start Pro Trial]│  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Note:** Pro pricing TBD. Mark placeholder with "Pricing coming soon" if not finalized. Do not show $29 placeholder — it sets an expectation you may not meet.

**"Most Popular" badge on Pro tier.**

### Layout
3 equal columns on desktop. Stacked on mobile with Pro tier first (most popular).

### Components
1. **Pricing Card** — `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8`. Pro card: `border-indigo-500 ring-2 ring-indigo-500/20`.
2. **Price Display** — Large price with currency, billing period below.
3. **Feature List** — `Check` icon from Lucide in green-500 for included, `X` icon in gray for excluded.
4. **CTA Button** — Free: outlined. Pro: filled indigo. Institution: indigo outlined.
5. **Most Popular Badge** — `bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full` positioned above the Pro card.

### CTA
- Free: `[Start Free →]` → `/register`
- Pro: `[Start Pro Free Trial →]` → `/register?plan=pro`
- Institution: `[Contact Us →]` → `/contact`

---

## SECTION 14 — FINAL CTA

### Purpose
The last conversion opportunity before the footer. For visitors who read the entire page and are still considering.

### User Psychology
- Visitors who reach this point are genuinely interested but have one last hesitation
- This section must be emotionally resonant, not just functional
- Creating a sense of momentum ("Join those already learning") overcomes inertia
- Reducing the risk one final time ("Free to start, no card required") removes the last barrier

### Business Goal
- Capture visitors who read everything and still haven't decided
- Provide role-specific final CTAs to maximize segmented conversion

### Content

**Headline:**
```
Uzbek: "Bugun boshlang. Bepul. Hech qanday to'lov ma'lumotlari talab qilinmaydi."
English: "Start today. Free. No payment information required."
```

**Subheadline:**
```
"Join 1,200+ students and 80+ teachers who are already using AI to learn faster, teach smarter, and achieve more."
```

**Role-Segmented CTA Buttons:**
```
[👨‍🎓 I'm a Student — Start Learning Free]
[👩‍🏫 I'm a Teacher — Create Class Free]
[🏫 I Represent a School — Let's Talk]
```

**Guarantee Line:**
```
🔒 Free forever plan available. No credit card. Cancel anytime. Data exported on request.
```

### Layout
```
Background: Subtle gradient (white → indigo-50 → white, horizontal)
OR: Dark section — bg-gray-900 text-white for contrast from the rest of the page
Content: Center-aligned, max-width 600px
CTA: 3 buttons stacked vertically on mobile, horizontal on desktop
```

### Components
1. **Section Background** — Either subtle gradient or dark contrast section. Dark is higher impact and creates visual variety.
2. **Headline** — Large, bold, emotional.
3. **CTA Buttons** — Each button clearly states the role. Different styling per role for scannability.
4. **Guarantee Line** — `text-sm text-gray-400`, lock icon, separator dots between items.

### Animation
- Headline fade up on viewport entry.
- Buttons stagger fade in 100ms apart.

---

## SECTION 15 — FOOTER

### Purpose
Navigation, legal, trust, and brand. Footer is also used by search engines and users looking for contact information.

### Content

**4-Column Layout:**

**Column 1 — Brand:**
```
[Logo + App Name]
"AI-powered education platform for Uzbekistan"
[Social links: Telegram | Instagram | YouTube]
© 2026 YordamchiAI. All rights reserved.
```

**Column 2 — Product:**
```
Header: Product
Links:
- Features
- How it Works
- Pricing
- AI Assistant
- Changelog (Phase 2)
```

**Column 3 — Resources:**
```
Header: Resources
Links:
- Help Center (Phase 2)
- Documentation (Phase 2)
- Blog (Phase 2)
- System Status (Phase 2)
```

**Column 4 — Company:**
```
Header: Company
Links:
- About Us
- Contact
- Privacy Policy  [← MUST BE <a> TAG, NOT <span>]
- Terms of Service  [← MUST BE <a> TAG, NOT <span>]
- Cookie Policy
```

**Language row (bottom of footer):**
```
[🇺🇿 O'zbek] [🇷🇺 Русский] [🇬🇧 English]
```

**Trust badges row:**
```
[🔒 SSL Secured] [⚡ Powered by Gemini 2.5 Flash] [🇺🇿 Made for Uzbekistan]
```

### Components
1. **All footer links must be `<a>` elements** — Not spans. Not divs. Anchor tags with proper `href`.
2. **Social links** — Open in `target="_blank" rel="noopener noreferrer"`.
3. **Language buttons** — Toggle the app language (same as Navbar language switcher).

### Accessibility Notes
- Footer wrapped in `<footer role="contentinfo">`
- Column headers are `<h3>` elements
- All links are `<a>` tags

### SEO Notes
- Footer links help Google discover all site pages
- Organization schema in footer (Phase 2):
```json
{
  "@type": "Organization",
  "name": "YordamchiAI",
  "url": "https://yordamchi-ai-alpha.vercel.app",
  "contactPoint": { "@type": "ContactPoint", "contactType": "customer support" }
}
```

---

## USER JOURNEY SPECIFICATION

### The Complete Funnel

```
[1] VISITOR
   ↓ lands on /
   ↓ 5-second test: "What is this? Is it for me?"
   ↓ DECISION: bounce or continue
   
[2] INTERESTED
   ↓ Reads hero, sees role match (Student/Teacher)
   ↓ Sees social proof bar — "others use it"
   ↓ DECISION: scroll to demo or click CTA
   
[3] TRUST
   ↓ Watches AI demo — "It actually works"
   ↓ Reads WHY section — "It's built for my situation"
   ↓ Reads testimonials — "Real people like me use it"
   ↓ DECISION: proceed to registration or read FAQ
   
[4] EXPLORE
   ↓ Reads FAQ — objections answered
   ↓ Reads Pricing — "I can start free"
   ↓ DECISION: register now or "I'll come back"
   
[5] REGISTER
   ↓ Clicks role-specific CTA → /register?role=student|teacher
   ↓ Minimal registration form (name, email, password, role)
   ↓ Email verification
   
[6] DASHBOARD
   ↓ Onboarding flow (role-specific)
   ↓ First AI interaction within 60 seconds of landing on dashboard
   ↓ Activation event: first AI message sent = "activated user"
```

### Section-to-Journey Mapping

| Section | Journey Stage | Primary Action |
|---------|--------------|----------------|
| Navigation | Visitor | Login or Register visible immediately |
| Hero | Visitor → Interested | Role identification + CTA click |
| Social Proof | Interested | Trust validation, continued scroll |
| AI Demo | Interested → Trust | AI demonstration, reduce skepticism |
| Why YordamchiAI | Trust | Differentiation, pre-empt alternatives |
| Features Grid | Trust → Explore | Deep feature evaluation by role |
| Student Experience | Interested/Trust | Student-specific story, role confirmation |
| Teacher Experience | Interested/Trust | Teacher-specific story, role confirmation |
| Education Center | Trust/Explore | Institutional buyer decision support |
| Statistics | Trust | Quantified social proof |
| Testimonials | Trust | Peer validation |
| FAQ | Explore | Objection removal |
| Pricing | Explore | Price expectation setting, plan selection |
| Final CTA | Explore → Register | Last-chance conversion with role selection |
| Footer | All | Navigation, legal, trust confirmation |

---

## IMPLEMENTATION PRIORITY

### Phase 1 — MVP Landing (1–2 weeks)
**Complexity: Medium**

All sections that exist today but need improvement. No new content or data dependencies.

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Fix footer links (span → a) | 30 min | Critical (legal) |
| 2 | Replace emoji icons with Lucide SVG | 1 hour | High (trust) |
| 3 | Add meta description + OG tags to index.html | 1 hour | High (SEO/social) |
| 4 | Rewrite hero headline (specific, not generic) | 2 hours | Critical (conversion) |
| 5 | Add friction-reducer under primary CTA | 30 min | High (conversion) |
| 6 | Fix `<html lang>` to dynamic based on selected language | 2 hours | High (SEO/a11y) |
| 7 | Add skip-to-main-content link | 1 hour | Medium (a11y) |
| 8 | Translate Pricing page to Uzbek/Russian | 3 hours | High (UX) |
| 9 | Add robots.txt and sitemap.xml to /public | 1 hour | High (SEO) |
| 10 | Add role-selector tabs to hero | 4 hours | High (conversion) |
| 11 | Add social proof bar (Section 03) | 3 hours | High (trust) |
| 12 | Add AI Demo section (static mockup of chat) | 6 hours | Critical (conversion) |
| 13 | Add Why YordamchiAI (Section 05) | 3 hours | High (differentiation) |
| 14 | Add FAQ section with accordion | 4 hours | Medium (conversion) |
| 15 | Add Final CTA section (Section 14) | 2 hours | High (conversion) |

**Phase 1 Expected Outcome:** Page goes from 3.1/10 to ~6/10. Conversion rate improves meaningfully.

---

### Phase 2 — Trust & SEO (2–4 weeks)
**Complexity: Medium-High**

Adds social proof content and SEO infrastructure that requires real data and content production.

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Add SSG (Static Site Generation) for landing | 3–5 days | Critical (SEO) |
| 2 | Add Features Grid section (role-tabbed) | 4–6 hours | High |
| 3 | Add Student Experience walkthrough | 3–4 hours | High |
| 4 | Add Teacher Experience walkthrough | 3–4 hours | High |
| 5 | Add Education Center section | 3 hours | Medium |
| 6 | Add real testimonials (3+ users) | Content dependent | Critical |
| 7 | Add Platform Statistics (animated counters) | 3 hours | High |
| 8 | Add Testimonials section | 3 hours | High |
| 9 | Add product screenshots to hero and demo | Design dependent | Critical |
| 10 | Add FAQ structured data (JSON-LD) | 2 hours | High (SEO) |
| 11 | Add Organization structured data | 1 hour | Medium (SEO) |
| 12 | Add institution logo strip (if available) | 2 hours | High |
| 13 | Add /contact page for institutional inquiries | 1 day | High (B2B) |
| 14 | Add /privacy and /terms pages with real content | Legal + 1 day | Critical (legal) |

**Phase 2 Expected Outcome:** Page reaches ~8/10. Organic search begins to function. Institutional pipeline opens.

---

### Phase 3 — Growth & Optimization (Month 2+)
**Complexity: High**

Advanced features requiring A/B testing infrastructure, API integrations, and significant content production.

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Live AI demo (sandboxed, no registration) | 2–3 weeks | Critical (conversion) |
| 2 | A/B test hero headlines | 1 week setup | High |
| 3 | Role-specific landing pages (/students, /teachers, /schools) | 1 week each | High (SEO + conversion) |
| 4 | Blog / Content hub for SEO | Ongoing | High (organic) |
| 5 | Multilingual SEO (hreflang) | 3 days | High |
| 6 | PWA manifest for mobile installation | 2 days | Medium |
| 7 | Chatbot / live chat widget | 1 week | Medium |
| 8 | Exit-intent popup (Phase 3 lead capture) | 2 days | Medium |
| 9 | Video testimonials | Production dependent | High |
| 10 | Analytics funnel tracking (events per section) | 2 days | High |

**Phase 3 Expected Outcome:** Page reaches 9–10/10. Organic traffic begins meaningful contribution. Institutional sales pipeline active.

---

## IMPLEMENTATION CONSTRAINTS

### Must NOT Do
- Never fabricate user numbers or testimonials
- Never use placeholder pricing that creates false expectations
- Never ship a section without the i18n translations (all 3 languages required simultaneously)
- Never use `<div onClick>` — all interactive elements must be `<a>` or `<button>`
- Never hard-code colors — use the design system tokens defined above

### Critical Technical Notes for Implementers
1. **The `<html lang>` attribute** must be updated dynamically when the user changes language. This requires setting `document.documentElement.lang` in the `LanguageContext` when language changes.
2. **The AI Demo (Section 04)** is a static mockup with CSS animations. It must NOT make real API calls on the landing page (unauthenticated users cannot use the AI endpoint). All "typing" and "response" behavior is purely visual.
3. **Social Proof numbers** must be fetched from the database or a config file — not hardcoded in the component. Create a `/api/stats` endpoint or Supabase query that returns current counts.
4. **Role-specific CTA links** must pass the role parameter: `/register?role=student`, `/register?role=teacher`. The Register page must read this parameter and pre-select the role.
5. **All images** (product screenshots, testimonial avatars) must use `loading="lazy"` except the hero visual (which must be `loading="eager"`).
6. **The demo animation** must respect `prefers-reduced-motion: reduce` — when set, show a static screenshot instead of the animated chat sequence.
