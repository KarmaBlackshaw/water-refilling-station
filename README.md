# Apartment Rental Management System

A multi-property apartment management app built with Vue 3 + Supabase supporting daily/monthly/shared tenants, utility meter tracking, and PDF receipt generation.

## Features

- **Multi-property management** - Manage multiple apartment buildings
- **Unit management** - Track units with different rental types (daily, monthly, shared)
- **Tenant management** - Add tenants, track check-in/check-out dates
- **Meter readings** - Record water and electricity readings with auto-populate from previous
- **Billing** - Generate bills for monthly/shared tenants with utility calculations
- **PDF receipts** - Download billing statements as PDF
- **Authentication** - Supabase Auth with email/password

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State**: Pinia
- **Backend**: Supabase (Auth + PostgreSQL)
- **PDF**: jsPDF

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Configure Supabase

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```sh
cp .env.example .env
```

### 3. Run database migrations

Execute the SQL in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

### 4. Start development server

```sh
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Lint and fix files
