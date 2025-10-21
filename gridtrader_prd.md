# GridTrader.io ‐ Product Requirements Document (PRD)
**Version:** v0.1 (MVP)  
**Date:** 2025‑10‑21  
**Owner:** Gridtrading Project

---

## 1. Vision & Objective  
**Vision:** To become the foremost AI‑powered portal that enables crypto traders to deploy optimized grid trading strategies effortlessly across exchanges.  
**Objective:** Launch an MVP for the portal with integration with Phemex, support a freemium monetization model (free tier + paid tiers), and validate market demand.

---

## 2. Business Goals & KPIs  

### Business Goals  
- Launch MVP that generates AI‑optimized grid strategies for Phemex.  
- Introduce free and paid tiers to start generating revenue within ~3 months.  
- Achieve user acquisition cost (UAC) under US $10 per user.  
- Reach 100 active paid users by end of Q2 post‑launch.

### Key Metrics  
- Conversion rate (Free → Paid): target ~8%  
- User retention: 30‑day retention ≥ 40%  
- Average simulated profit per grid: ~2–5%  
- Platform uptime: 99.5% or higher  
- Number of AI grid generations per user per week: target ≥ 3  
- Monthly Recurring Revenue (MRR): Target $1,000 within first quarter.

---

## 3. Product Summary  
**Core Value Proposition:**  
Provide crypto traders—both novices and experienced—with AI‑driven grid trading parameters (price range, grid count, spacing, investment allocation) that reduce manual tuning and enhance performance.  
**Scope (MVP):** Support Phemex only initially; later expand to multiple exchanges.

---

## 4. User Segments & Pricing Tiers  

| Segment             | Description                          | Needs                                   | Tier           |
|---------------------|--------------------------------------|-----------------------------------------|----------------|
| Beginner Trader     | New to grid trading                  | Easy setup, explanation, guided UI      | Free Tier      |
| Intermediate Trader | Already uses grids manually/trading  | Data‑driven optimisation, API support   | Pro Tier ($19/mo) |
| Power Trader        | Manages many bots/accounts           | Advanced analytics, multi‑exchange      | Premium Tier ($49/mo) |

### Tier Details  
- **Free Tier**: 1 AI grid generation per day, no API trading deployment, basic backtest.  
- **Pro Tier** ($19/mo): Unlimited AI grid generations, API deployment to Phemex, real‑time profit analytics.  
- **Premium Tier** ($49/mo): Multi‑exchange support (when available), auto‑optimization, advanced dashboard, priority support.

---

## 5. Features & Requirements  

### MVP (Phase 1: Phemex)  
**P0 – Must‑haves**  
- AI Grid Generator: Input coin pair → output optimized grid parameters.  
- Phemex API Connection: Allow user to link Phemex account via API keys (spot &/or futures).  
- User Dashboard: View saved grids, active deployments, PnL summary.  
- Free Tier Availability: Enforce limitations (1 grid/day).  

**P1 – High Priority**  
- Backtest Simulator: Historical simulation of grid strategy (profit, volatility, drawdown).  
- Payment Integration: Stripe (or crypto payment) for subscriptions.  
- Pro Tier Features: Live deployment, live stats updates.

**Phase 2+ (Future)**  
- Multi‐exchange support (e.g., Binance, Bybit, OKX)  
- Smart auto‑optimization: AI adjusts grid parameters dynamically.  
- Social / Copy trading: Share strategies, leaderboard.

---

## 6. Technical Requirements  

**Backend**  
- Framework: Python (FastAPI) or Node.js.  
- Services: User management, AI model serving, exchange integrations.  
- Storage: PostgreSQL or MongoDB for users, grids, simulations.  
- AI Model: Start with heuristic/rule‑based optimisation; plan ML model for future.  
- Exchange Integration: Phemex REST & WebSocket APIs for order placement and updates.  

**Frontend**  
- Framework: React + Tailwind CSS.  
- Features: Login/signup, connect exchange, grid generator UI, dashboard.  

**Security & Compliance**  
- Secure storage of API keys (encrypted).  
- Use HTTPS.  
- JWT for user sessions.  
- Role‑based access control (free vs paid).  
- Legal disclaimers about trading risk.  

**Infrastructure**  
- Cloud hosting: AWS (EC2/Elastic Beanstalk) or similar.  
- Scalability: Auto‑scaling where needed.  
- Monitoring & logging: Uptime, error tracking.  

**Payments**  
- Use Stripe (or similar) for subscription billing.  
- Optionally support crypto payments (as future enhancement).  

---

## 7. Monetization Model  

| Tier       | Price       | Features                                   |
|------------|-------------|--------------------------------------------|
| Free       | $0          | 1 AI grid/day, no deployment, basic backtest |
| Pro        | $19/mo      | Unlimited grids, live Phemex deployment, realtime analytics |
| Premium    | $49/mo      | Multi‐exchange (once enabled), auto‑optimisation, advanced analytics |
| Enterprise | Custom       | Whitelabel or managed service for funds    |

---

## 8. User Flow (MVP)  

1. User visits GridTrader.io and signs up (Email/password or Google OAuth).  
2. User logs in and sees dashboard.  
3. User selects “Connect Exchange” → enters Phemex API key & secret.  
4. User chooses trading pair (e.g., BTC/USDT).  
5. User clicks “Generate Grid” → AI returns grid parameters (upper/lower bound, # of levels, spacing, allocation).  
6. User reviews generated grid and simulated backtest results (profit estimate, drawdown).  
7. If user is on Pro tier: they click “Deploy to Phemex” → orders placed via API, grid is live.  
8. Dashboard shows live P&L, open orders, closed trades, performance summary.  
9. User receives notifications (optional) about grid performance or recommended changes.  
10. At end of billing cycle user can upgrade/downgrade.  

---

## 9. Success Criteria  

- 1,000+ sign‑ups in first 3 months.  
- MRR ≥ $1,000 within the first quarter.  
- Conversion Free→Paid ≥ 8%.  
- 30‑day retention ≥ 40%.  
- Grid generation latency < 5 seconds.  
- Platform uptime ≥ 99.5%.  

---

## 10. Risks & Mitigations  

| Risk                                   | Mitigation                                                         |
|----------------------------------------|--------------------------------------------------------------------|
| AI recommendations underperform        | Provide backtest results and confidence scores; make clear disclaimers. |
| Exchange API downtime or change        | Implement robust error‑handling; monitor API status; fallback gracefully. |
| Users hesitant to supply API keys      | Provide read‑only mode or partial API key permissions; clear security statement. |
| Regulatory issues with trading tools   | Include legal disclaimer, make clear non‑custodial service, avoid promise of returns. |
| High churn/non‑engagement             | Provide onboarding, tutorials, educational content; build community. |

---

## 11. Roadmap (6‑Month Plan)  

| Month     | Milestone                                              |
|-----------|--------------------------------------------------------|
| Month 1–2 | Build MVP backend & frontend: AI generator, Phemex API, dashboard. |
| Month 3   | Launch beta, invite early users, collect feedback.     |
| Month 4–5 | Implement payment infrastructure, Pro tier features, backtest module. |
| Month 6   | Official public launch, marketing push, aim for first paid subscriptions. |
| Month 7–8 | Expand exchange support (Phase 2).                     |
| Month 9+  | Develop auto‑optimization, social/copy features.       |

---

## 12. Brand & Naming  
**Project/Domain Name:** GridTrader.io  
**Tone & Positioning:** Tech‑savvy, trustworthy, performance‑oriented.  
**Key Messages:**  
- “AI‑Optimised Grid Trading for Crypto”  
- “Deploy smarter grids, reduce manual tuning”  
- “Get started for free, upgrade when you’re ready”  

---

### Appendices  
**A. Glossary**  
- *Grid Trading:* A systematic trading method that places buy and sell orders at preset intervals (prices) creating a “grid” of orders.  
- *AI Grid Generator:* System that suggests optimal grid parameters given market conditions.  
- *Backtest Simulator:* Module that runs historical data through the proposed grid to estimate outcomes.  
- *MRR:* Monthly Recurring Revenue.

**B. Regulatory Disclaimer (to include in UI/legal page)**  
> Trading cryptocurrencies involves significant risk. Past results do not guarantee future performance. GridTrader.io is a software tool only, does not guarantee profits, and does not act as a broker or custodian.

