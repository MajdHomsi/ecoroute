# EcoRoute Personal Carbon Footprint Tracker

EcoRoute is a full-stack web application that lets everyday commuters log their transit trips and instantly see how much CO₂ they're emitting. It features a real-time carbon dashboard, data visualizations, full trip management, and an AI-powered Carbon Coach chat advisor built on the Groq API.

---

## Features

- **User Authentication** — Secure register and login with JWT and bcrypt password hashing
- **Trip Logging** — Log trips by transport mode and distance, CO₂ calculated automatically
- **Carbon Dashboard** — Live stats showing CO₂ this week, this month, and total trips
- **Data Visualization** — Bar chart (CO₂ per trip) and pie chart (CO₂ by transport mode)
- **Trip History** — Filter by mode and date, paginated table with edit and delete
- **AI Carbon Coach** — Floating chat widget powered by Groq LLaMA 3.1 that answers questions about your trip history and gives personalized reduction tips
- **Unit Tests** — Jest test suite covering CO₂ calculator, auth routes, and trip routes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Recharts, Axios |
| Backend | Node.js, Express |
| Database | PostgreSQL via Supabase |
| Authentication | JWT + bcrypt |
| AI | Groq API — LLaMA 3.1 8B Instant |
| Testing | Jest, Supertest |

---

## Prerequisites

- Node.js v20+
- A free Supabase account — [supabase.com](https://supabase.com)
- A free Groq API key — [console.groq.com](https://console.groq.com)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/MajdHomsi/ecoroute.git
cd ecoroute
```

### 2. Set up the database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `backend/config/schema.sql`
3. Go to **Connect → Session Pooler** and copy your connection string

### 3. Configure environment variables

Create a `.env` file inside the `backend/` folder:
