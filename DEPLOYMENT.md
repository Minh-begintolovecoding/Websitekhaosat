# Deployment & SEM Analysis Guide: Witte et al. (2025) Replication

This repository contains the complete full-stack web experimentation platform reproducing:
> **"Dark patterns in online retailing: an analysis based on information manipulation theory"** (Witte et al., 2025).

Designed for academic data collection and structural equation modeling (SEM) with **SPSS, AMOS, SmartPLS, R (lavaan), and Python (semopy)**.

---

## 1. Architecture Overview

- **Frontend**: React 19, TypeScript, Tailwind CSS, React Router, Vite, Lucide Icons.
- **Backend API**: Node.js, Express.js.
- **Database**: PostgreSQL (Cloud SQL Developer Edition / RDS / local PostgreSQL).
- **ORM / Migrations**: Drizzle ORM (native connection pool) + Prisma Schema + SQL migrations (`migrations/0001_init.sql`).
- **Authentication**: Firebase Authentication with Google Sign-In and Researcher Master Key.

---

## 2. Experimental Design & Algorithm

### Between-Subjects 4-Condition Design
1. **CONTROL**: Clean neutral hoodie stimulus (599.000 VND), standard free shipping, zero dark patterns.
2. **SCARCITY**: Control stimulus + strictly:
   - `⚠ Chỉ còn 3 sản phẩm trong kho`
   - `👁 53 người đang xem sản phẩm này`
3. **SNEAKING**: Product page is identical to CONTROL. When navigating to Cart, automatically injects `Premium Shipping = 100.000 VND` (Total: 699.000 VND) without participant selection.
4. **BOTH**: Scarcity on Product Page + Sneaking on Cart Page.

### Balanced Assignment Algorithm
- Target: 100 participants per group ($N = 400$).
- New participants are assigned to the group with the lowest count in the database.
- Ties are broken with uniform random selection.
- Assigned group and `participant_uuid` are stored in PostgreSQL, `localStorage`, and HTTP cookies. Revisits reuse the existing session. Duplicate submissions are strictly prevented.

### Quality Control & Timing
- Speeder detection: `survey_duration < 60s` sets `is_speeding = true` (retained with flag).
- Manipulation check verification: Checks whether participants noted the scarcity banner or cart fee.
- Millisecond precision behavioral duration tracking: Product page, Cart page, Survey, Total.

---

## 3. Environment Variables

Create `.env` (or configure in your Cloud Run / Docker deployment):

```bash
# PostgreSQL Connection (Cloud SQL or standard PostgreSQL)
SQL_HOST="/cloudsql/YOUR_INSTANCE_CONNECTION_NAME" # or localhost
SQL_DB_NAME="postgres"
SQL_USER="postgres"
SQL_PASSWORD="your-strong-password"
SQL_ADMIN_USER="postgres"
SQL_ADMIN_PASSWORD="your-strong-password"

# Optional Researcher Passcode for Admin Dashboard Access
ADMIN_SECRET_KEY="researcher2025"

# App Port
PORT=3000
```

---

## 4. Setup & Running

### Development Mode
```bash
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the platform.

### Database Migration
If deploying onto a standalone PostgreSQL instance:
```bash
# Using raw SQL migration:
psql -h $SQL_HOST -U $SQL_USER -d $SQL_DB_NAME -f migrations/0001_init.sql

# Or using Prisma:
npx prisma db push
```

### Production Build & Launch
```bash
npm run build
npm start
```

---

## 5. SEM Analysis Pipeline

1. Log into `/admin` using your Google account or the researcher passcode (`researcher2025`).
2. Download the flat table via **Tải file CSV** or **Tải file Excel**.
3. Use the generated syntax files:
   - **SPSS / AMOS**: Run `witte_2025_spss_syntax.sps` to compute latent construct means, Cronbach's alpha, ANOVA across experimental groups, and regression models.
   - **R lavaan**: Run `witte_2025_lavaan_sem.R` to estimate the full CFA measurement model and structural paths ($QUAL/QUAN/REL/CLA \rightarrow PCM \rightarrow ATT \rightarrow PI/LOY$).
   - **Python semopy**: Run `witte_2025_semopy_sem.py` for automated statistical fit indexes ($CFI, TLI, RMSEA, SRMR$) and HTML report generation.
   - **SmartPLS**: Import the `.csv` flat-table directly; indicators `qual1-4`, `quan1-4`, `rel1-3`, `cla1-4`, `pcm1-6`, `att1-4`, `pi1-3`, `loy1-3`, `fam1-4` are pre-named to match standard notation.
