# PRODUCTION WHITE SCREEN — INCIDENT REPORT
**Severity:** P0 — Production Down  
**Date:** 2026-06-26  
**Production URL:** https://yordamchi-ai-alpha.vercel.app  
**Symptom:** White screen on all mobile devices. Desktop appears to work due to browser cache.

---

## ROOT CAUSE

**Confidence: 100% — Confirmed by direct inspection of the production JavaScript bundle.**

### What is happening

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are **not configured as Environment Variables in the Vercel project settings**.

When Vercel built the production bundle (deployed from commit `901a81a` — "Achievement system completed"), these variables were absent from the build environment. Vite baked `undefined` into the bundle in place of both values.

At runtime, when the JavaScript module is evaluated, the following code in `src/lib/supabase.ts` executes:

```typescript
// src/lib/supabase.ts — lines 4–14
const supabaseUrl     = import.meta.env['VITE_SUPABASE_URL']     as string
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[YordamchiAI] Supabase sozlanmagan.\n' +
    "Iltimos, .env faylida quyidagilarni to'ldiring:\n" +
    '  VITE_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key-here',
  )
}
```

In the production bundle, this compiles to (extracted from `index-BHomWjOj.js`):

```javascript
Nu = {
  BASE_URL: `/`,
  DEV: false,
  MODE: `production`,
  PROD: true,
  SSR: false,
  VITE_VERCEL_BRANCH_URL: `yordamchi-ai-git-main-...`,
  VITE_VERCEL_DEPLOYMENT_ID: `dpl_Hjsm7oeYL7pNsM1b5sEoY3HzSeZU`,
  VITE_VERCEL_ENV: `production`,
  // ... all Vercel system variables ...
  // ❌ NO VITE_SUPABASE_URL
  // ❌ NO VITE_SUPABASE_ANON_KEY
}.VITE_SUPABASE_URL   // → undefined

Pu = { /* same env object */ }.VITE_SUPABASE_ANON_KEY  // → undefined

if (!Nu || !Pu) throw Error(`[YordamchiAI] Supabase sozlanmagan...`)
//  !undefined || !undefined
//  true       || true
//  ↑ FIRES — throws synchronously during module initialization
```

### Why this causes a white screen

The `throw` is **module-level** — it executes synchronously when `index-BHomWjOj.js` is first evaluated by the browser's JavaScript engine. This happens BEFORE `ReactDOM.createRoot()` is called.

Call chain that triggers the throw:
```
Browser loads index-BHomWjOj.js
  → Module evaluation begins
  → supabase.ts module is initialized
  → throw Error('[YordamchiAI] Supabase sozlanmagan...')
  → Module evaluation ABORTED
  → React.createRoot() never executes
  → <div id="app"></div> stays empty
  → WHITE SCREEN
```

No ErrorBoundary can catch this — it happens before React has any chance to render.

---

## EXACT FILE AND LINE

| | |
|---|---|
| **File** | `src/lib/supabase.ts` |
| **Lines** | 7–14 |
| **Type** | Synchronous module-level `throw Error` |
| **Trigger** | Both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are `undefined` at build time |

---

## EVIDENCE — DIRECT BUNDLE INSPECTION

**Production bundle:** `https://yordamchi-ai-alpha.vercel.app/assets/index-BHomWjOj.js`  
**Deployed commit:** `901a81aeea4030d6959316a5d5900846a11ea0d8` ("Achievement system completed")  
**Last-Modified:** Wed, 24 Jun 2026 12:43:41 GMT

The env object in the production bundle contains:
```
VITE_VERCEL_BRANCH_URL ✅
VITE_VERCEL_DEPLOYMENT_ID ✅
VITE_VERCEL_ENV ✅
VITE_VERCEL_GIT_COMMIT_AUTHOR_LOGIN ✅
VITE_VERCEL_PROJECT_PRODUCTION_URL ✅
... (16 Vercel system variables) ✅

VITE_SUPABASE_URL ❌ NOT PRESENT
VITE_SUPABASE_ANON_KEY ❌ NOT PRESENT
```

**Local build bundle:** `dist/assets/index-B8BdEmT1.js`

The local bundle (built with `.env` file present) contains:
```javascript
{
  VITE_SUPABASE_URL: `https://autzctvxctzzjdqwqzod.supabase.co`,  ✅
  VITE_SUPABASE_ANON_KEY: `sb_publishable_UraFX521UUUt8rWAU42XFA_bntXyeUN`,  ✅
  ...
}
```

**This is the definitive proof.** The production bundle is missing the Supabase variables. The local bundle has them.

---

## WHY DESKTOP APPEARS TO WORK

Desktop browsers (specifically the developer's machine) have a **cached version of an older, working production bundle** from a previous Vercel deployment when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` were correctly configured in Vercel.

The Vercel response headers confirm caching:
```
Cache-Control: public, max-age=0, must-revalidate
X-Vercel-Cache: HIT
Age: 115964
```

Sequence of events:
1. ✅ Previously: Vercel had env vars configured → bundle had real Supabase values → site worked
2. ⚡ At some point: Env vars were removed from Vercel (or never added to new project setup)
3. 🔨 Commit `901a81a` deployed → Vercel built without env vars → broken bundle deployed
4. ✅ Desktop: Browser cache serves the OLD working bundle → site appears to work
5. ❌ Mobile: No cache (or cache cleared) → loads the NEW broken bundle → white screen
6. ❌ Desktop (fresh cache/incognito): Would also show white screen

---

## WHY LOCALHOST WORKS

Local development uses `npm run dev` which reads the `.env` file:

```bash
# .env (NOT committed to git — confirmed via git ls-files)
VITE_SUPABASE_URL=https://autzctvxctzzjdqwqzod.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_UraFX521UUUt8rWAU42XFA_bntXyeUN
```

Vite injects these at build/serve time. Both values are present → `if (!supabaseUrl || !supabaseAnonKey)` is `false` → no throw → app initializes normally.

The `.env` file is in `.gitignore` (confirmed: `.env`, `.env.local`, `.env.*.local` are ignored). Vercel cannot access it — it must be configured separately in the Vercel dashboard.

---

## REPRODUCTION STEPS

1. Open browser DevTools → Network tab
2. Hard refresh https://yordamchi-ai-alpha.vercel.app (Ctrl+Shift+R or clear cache)
3. Observe: `index-BHomWjOj.js` loads (HTTP 200)
4. Open Console → Error:
   ```
   [YordamchiAI] Supabase sozlanmagan.
   Iltimos, .env faylida quyidagilarni to'ldiring:
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Observe: Page is white, `<div id="app"></div>` is empty

**Why "desktop works" with cached state:** DevTools → Application → Storage → Clear site data → Reload → Desktop will also show white screen.

---

## RECOMMENDED FIX

**No code changes required.** This is a Vercel configuration issue only.

### Step 1 — Add Environment Variables to Vercel Dashboard

Navigate to: **Vercel Dashboard → yordamchi-ai project → Settings → Environment Variables**

Add the following for **Production** environment:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://autzctvxctzzjdqwqzod.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_UraFX521UUUt8rWAU42XFA_bntXyeUN` |

### Step 2 — Redeploy

Trigger a new deployment. Vercel will rebuild the bundle with the correct env vars baked in.

```bash
# Option A: Push a commit (any change)
git commit --allow-empty -m "fix: add VITE_SUPABASE env vars to Vercel"
git push

# Option B: Redeploy from Vercel dashboard
# Deployments → ... → Redeploy
```

### Step 3 — Verify

After deployment:
1. Hard refresh the production URL
2. Open DevTools → Console: no errors
3. Site renders correctly
4. Test on mobile (fresh load)

---

## SUMMARY

| | |
|---|---|
| **Root Cause** | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` not set in Vercel Environment Variables |
| **Effect** | Module-level `throw Error` fires before React mounts |
| **File** | `src/lib/supabase.ts:7–14` |
| **Code path** | `supabase.ts → throw → module load aborts → ReactDOM.createRoot() never runs → white screen` |
| **Why desktop works** | Browser cache serves old working bundle from previous deployment |
| **Why mobile fails** | No cache → loads current broken bundle → crash |
| **Fix** | Add 2 env vars to Vercel dashboard + redeploy |
| **Code changes needed** | **None** |
| **Confidence** | **100%** — confirmed by direct inspection of production bundle |
