# ENVIRONMENT VARIABLES REPORT
**Project:** YordamchiAI  
**Date:** 2026-06-26  
**Status:** ⚠️ Production broken — 2 required variables missing from Vercel

---

## COMPLETE AUDIT RESULTS

### Scan Method
Grepped all `import.meta.env.*` accesses across `src/` and `supabase/functions/`.

### Files Scanned
- `src/lib/supabase.ts`
- `src/services/api.ts`
- `supabase/functions/ai-chat/index.ts`
- `supabase/functions/admin-users/index.ts`

---

## 1. REQUIRED VARIABLES (App fails without these)

| Variable | Used In | Status in .env | Status in Vercel | Action Required |
|----------|---------|---------------|-----------------|-----------------|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts:4` | ✅ Set | ❌ **MISSING** | **Add to Vercel NOW** |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts:5` | ✅ Set | ❌ **MISSING** | **Add to Vercel NOW** |

**Failure mode:** Both variables are read at module initialization. If either is `undefined`, `src/lib/supabase.ts` throws synchronously before React mounts. Result: white screen.

Confirmed from production bundle `index-BHomWjOj.js`: neither variable appears in the baked env object — only Vercel system variables (`VITE_VERCEL_*`) are present.

---

## 2. OPTIONAL VARIABLES (App works without them — safe defaults exist)

| Variable | Used In | Default Value | Notes |
|----------|---------|--------------|-------|
| `VITE_API_URL` | `src/services/api.ts:1` | `http://localhost:3000/api` | Legacy REST API. None of the live pages import `api.ts` services. Safe to omit. |

---

## 3. NOT FRONTEND VARIABLES (Edge Functions — set via Supabase CLI only)

These are **server-side secrets** in Supabase Edge Functions. They are **never** set as Vercel Environment Variables. They are **never** in `.env`.

| Variable | Used In | How to Set |
|----------|---------|-----------|
| `GEMINI_API_KEY` | `supabase/functions/ai-chat/index.ts:7` | `supabase secrets set GEMINI_API_KEY=...` |
| `SUPABASE_URL` | `supabase/functions/admin-users/index.ts:27,34` | Auto-injected by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase/functions/admin-users/index.ts:28` | Auto-injected by Supabase |
| `SUPABASE_ANON_KEY` | `supabase/functions/admin-users/index.ts:35` | Auto-injected by Supabase |

---

## 4. VERCEL SYSTEM VARIABLES (Auto-injected — do not set manually)

Vercel automatically provides these at build time. They were confirmed present in the production bundle:

| Variable | Value in Production Bundle |
|----------|--------------------------|
| `VITE_VERCEL_ENV` | `production` |
| `VITE_VERCEL_BRANCH_URL` | `yordamchi-ai-git-main-...vercel.app` |
| `VITE_VERCEL_DEPLOYMENT_ID` | `dpl_Hjsm7oeYL7pNsM1b5sEoY3HzSeZU` |
| `VITE_VERCEL_GIT_COMMIT_SHA` | `901a81aeea4030d6959316a5d5900846a11ea0d8` |
| `VITE_VERCEL_PROJECT_PRODUCTION_URL` | `yordamchi-ai-alpha.vercel.app` |
| *(+ 11 more `VITE_VERCEL_GIT_*` vars)* | |

> ⚠️ These are only exposed to the frontend if your Vercel project has "Expose System Environment Variables" enabled under Project Settings → Environment Variables.

---

## 5. LOCAL vs PRODUCTION COMPARISON

| Variable | `.env` (local) | Vercel Prod | Result |
|----------|--------------|-------------|--------|
| `VITE_SUPABASE_URL` | `https://autzctvxctzzjdqwqzod.supabase.co` | ❌ Not set | **White screen** |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_UraFX521UUUt8rWAU42XFA_bntXyeUN` | ❌ Not set | **White screen** |
| `VITE_API_URL` | Not set | Not set | ✅ OK (has default) |

---

## 6. ROOT CAUSE TIMELINE

```
.env (local) → git ignored ← confirmed in .gitignore
     ↓
Vercel builds from git → no .env available
     ↓
VITE_SUPABASE_URL = undefined  (not in Vercel project settings)
VITE_SUPABASE_ANON_KEY = undefined  (not in Vercel project settings)
     ↓
src/lib/supabase.ts:7 → throw Error() fires synchronously
     ↓
JavaScript module evaluation aborted before React mounts
     ↓
<div id="app"></div> stays empty → WHITE SCREEN
```

---

## 7. CODE CHANGES MADE

### `src/lib/supabase.ts` — Improved error message

**Before:** error message only mentioned `.env` (useless in production)  
**After:** error message covers both local `.env` and Vercel dashboard with exact navigation path. Also prints current values for faster debugging.

### `.env.example` — Complete rewrite

Added:
- Clear LOCAL vs VERCEL sections
- Which variables are required vs optional
- Explanation of Edge Function secrets (not frontend vars)
- Vercel navigation path

---

## 8. EXACT VERCEL ENVIRONMENT VARIABLES TO ADD

Navigate to: **https://vercel.com/dashboard → yordamchi-ai → Settings → Environment Variables**

Add these two variables. Select **Production** (and optionally Preview):

```
┌────────────────────────────────┬──────────────────────────────────────────────────────┬────────────────────────────┐
│ Name                           │ Value                                                │ Environment                │
├────────────────────────────────┼──────────────────────────────────────────────────────┼────────────────────────────┤
│ VITE_SUPABASE_URL              │ https://autzctvxctzzjdqwqzod.supabase.co             │ Production, Preview        │
│ VITE_SUPABASE_ANON_KEY         │ sb_publishable_UraFX521UUUt8rWAU42XFA_bntXyeUN      │ Production, Preview        │
└────────────────────────────────┴──────────────────────────────────────────────────────┴────────────────────────────┘
```

> The `VITE_SUPABASE_ANON_KEY` is a **publishable** key — it is safe to expose in the browser. It is not a secret.

---

## 9. IS A REDEPLOY REQUIRED?

**YES. A redeploy is mandatory.**

Vite bakes environment variables into the JavaScript bundle at **build time**. Adding variables to Vercel does NOT update the existing deployed bundle. A new build must be triggered.

### Redeploy options (choose one):

**Option A — Push an empty commit (recommended):**
```bash
git commit --allow-empty -m "fix: add VITE_SUPABASE_* to Vercel env vars, trigger redeploy"
git push origin main
```

**Option B — Redeploy from Vercel Dashboard:**
1. Vercel Dashboard → yordamchi-ai → Deployments
2. Click `...` on the latest deployment → Redeploy
3. Verify new deployment does NOT use the old build cache

---

## 10. VERIFICATION AFTER REDEPLOY

Run these checks after the new deployment is live:

```bash
# 1. Fetch the new production bundle name
curl -s https://yordamchi-ai-alpha.vercel.app/ | grep 'assets/index-'

# 2. Check that SUPABASE_URL is now baked in (should return the URL)
curl -s https://yordamchi-ai-alpha.vercel.app/assets/<NEW_BUNDLE>.js \
  | grep -o 'autzctvxctzzjdqwqzod[^"]*'

# 3. Confirm the site loads
curl -sI https://yordamchi-ai-alpha.vercel.app/ | grep "HTTP/"

# 4. Open in incognito on mobile — no white screen
```

Expected result after fix: bundle contains `VITE_SUPABASE_URL:\`https://autzctvxctzzjdqwqzod.supabase.co\``

---

## SUMMARY

| | Count |
|---|---|
| Required variables | 2 |
| Missing from Vercel | 2 ← **root cause of white screen** |
| Optional variables | 1 |
| Edge Function secrets | 4 (separate system, not Vercel) |
| Code changes made | 2 files (`supabase.ts`, `.env.example`) |
| Redeploy required | **YES** |
