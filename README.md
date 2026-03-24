# NextSport ⚾ — AI Baseball Swing Analyzer

Mobile-first AI swing coach. Upload your swing, get pro-level analysis in minutes.

## Tech Stack

- **Next.js 15** App Router
- **Supabase** — Auth + PostgreSQL database
- **Stripe** — $14.99/mo Premium subscriptions
- **Tailwind CSS** — Dark sports aesthetic
- **OpenAI** — Swing analysis pipeline (to wire up)

## Setup

### 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Google OAuth in Authentication → Providers

### 2. Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://nextsport.vercel.app
OPENAI_API_KEY=sk-proj-...
```

### 3. Stripe

1. Create a recurring price in Stripe Dashboard ($14.99/mo)
2. Set `STRIPE_PREMIUM_PRICE_ID` env var with the price ID
3. Set up webhook endpoint: `https://nextsport.vercel.app/api/stripe/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 4. Deploy to Vercel

Connect your GitHub repo to Vercel and add all env vars in Vercel dashboard.

## Token System

- **Free:** 10 tokens/week, 1 token = 10 seconds of video
- **Premium:** 200 tokens/week + unlimited analyses
- **Referral:** +30 tokens when referred friend completes first analysis
- **Weekly refill:** Call `POST /api/tokens/refill` via cron (add `CRON_SECRET` env var)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | Create account |
| `/login` | Sign in |
| `/onboarding` | 3-step setup wizard |
| `/dashboard` | Home dashboard |
| `/analyze` | Upload & analyze swing |
| `/drills` | Drill gallery |
| `/drills/[id]` | Drill detail |
| `/profile` | Profile & referrals |
| `/pricing` | Pricing & Stripe checkout |

## TODO / Wiring Up

- [ ] Wire up real OpenAI video analysis in `/api/analyze`
- [ ] Upload video to Supabase Storage before analysis
- [ ] Generate annotated result video
- [ ] Set `STRIPE_PREMIUM_PRICE_ID` env var with real Stripe price ID
- [ ] Configure Stripe webhook in dashboard
- [ ] Set up weekly cron for `/api/tokens/refill`
- [ ] Add Supabase Google OAuth credentials
