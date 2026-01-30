# Golasco Property PWA – MVP Plan

## 1. Goals & Scope (MVP)
Roles for v1:
- Customer
- Agent
- Franchise Owner

Main focus:
- Secure email/password login with JWT (no OTP)
- Role‑based access (Customer, Agent, Franchise Owner)
- Property management with basic details
  - City
  - Price
  - Type (1BHK, 2BHK, Plot, etc.)
  - Status (Available / Booked / Sold)
- Simple franchise structure (each property belongs to a franchise, each agent belongs to a franchise)
- Lead & booking flow for customers
- Razorpay payment integration for booking fee (ONLINE PAYMENT – minimal but REAL)
- Clean dashboards for each role

Out of scope for very first cut (can be added later):
- Push notifications
- Offline mode
- Advanced analytics, reports
- Floor plans, videos, heavy media
- Complex commission logic

---

## 2. High‑Level Architecture

### Backend (FastAPI + MongoDB)
- Single FastAPI app under `/api` prefix (already set up in server.py)
- MongoDB via `motor` async driver
- JWT auth via `python-jose`, `passlib`, `bcrypt`
- Razorpay integration via `requests` or razorpay‑python SDK (depending on availability in environment)

### Frontend (React + Tailwind + shadcn UI)
- SPA with React Router
- PWA‑ready (later can add manifest & service worker; for now focus on responsive web that can be wrapped as PWA)
- Design direction for **Golasco Property**:
  - Primary color: deep teal / emerald mix (e.g., teal‑600 like) – modern, real‑estate look
  - Accent: warm amber for CTAs
  - Background: off‑white with subtle cards

### Security & Auth
- Email + Password registration and login
- Password hashed with bcrypt
- Access token (JWT) stored in memory + localStorage on frontend
- Role & franchise ID encoded in JWT payload

---

## 3. Data Model & Collections (MongoDB)

### 3.1 Users Collection (`users`)
Fields:
- `_id` (ObjectId)
- `id` (UUID string for external use)
- `email` (unique)
- `password_hash`
- `full_name`
- `role`: `"customer" | "agent" | "franchise_owner" | "super_admin"` (reserve super_admin for future)
- `franchise_id` (nullable, for agent & franchise owner)
- `created_at`, `updated_at`

### 3.2 Franchises Collection (`franchises`)
- `_id`
- `id` (UUID)
- `name`
- `city`
- `owner_user_id` (user.id of franchise owner)
- `created_at`, `updated_at`

### 3.3 Properties Collection (`properties`)
- `_id`
- `id` (UUID)
- `title`
- `description`
- `city`
- `price` (number)
- `property_type` (string; e.g., "1BHK", "2BHK", "Plot")
- `status`: `"available" | "booked" | "sold"`
- `franchise_id`
- `assigned_agent_id` (optional)
- `created_at`, `updated_at`

### 3.4 Leads / Bookings (`leads`)
- `_id`
- `id` (UUID)
- `customer_id` (user.id)
- `property_id`
- `assigned_agent_id`
- `franchise_id`
- `type`: `"site_visit" | "loan" | "booking"`
- `status`: `"new" | "in_progress" | "completed" | "cancelled"`
- `razorpay_order_id` (optional)
- `razorpay_payment_id` (optional)
- `amount` (for booking payments)
- `created_at`, `updated_at`

---

## 4. API Design (Backend)
Base path: `/api`

### 4.1 Auth
- `POST /api/auth/register`  
  - Body: `{ email, password, full_name, role, franchise_id? }`  
  - Rules:
    - For now, allow only `customer` self‑registration from frontend.
    - Agents & Franchise owners will be created by an admin endpoint.
  - Returns: user info + JWT.

- `POST /api/auth/login`  
  - Body: `{ email, password }`  
  - Returns: `{ access_token, token_type, user: {id, role, franchise_id, full_name} }`

- `GET /api/auth/me`  
  - Header: `Authorization: Bearer <token>`  
  - Returns current user.

### 4.2 Franchise Management
- `POST /api/franchises` (protected: super_admin only for now; in MVP we can seed one franchise via script or simple unsecured endpoint guarded by simple check)  
  - Body: `{ name, city, owner_user_id? }`
- `GET /api/franchises` (protected: super_admin, franchise_owner – owner sees own franchise; agents/customers don’t need this for MVP).

### 4.3 Agent Management
- `POST /api/agents` (protected: franchise_owner)  
  - Create agent user under their franchise.
- `GET /api/agents/my` (protected: franchise_owner)  
  - List agents for that franchise.

### 4.4 Property Management
- `POST /api/properties` (protected: franchise_owner, agent)
  - Body: `{ title, description, city, price, property_type, status, assigned_agent_id? }`
  - Auto‑attach `franchise_id` from user.

- `GET /api/properties` (public for browse – but filter by status & optional city/type)
  - Query params: `city?`, `type?`, `status?`

- `GET /api/properties/{id}` (public)

- `PUT /api/properties/{id}` (protected: franchise_owner or assigned_agent)

- `DELETE /api/properties/{id}` (protected: franchise_owner)

### 4.5 Lead / Booking & Razorpay

- `POST /api/leads` (protected: customer)
  - For enquiry / site visit / loan:  
    `{ property_id, type, message? }`  (no payment)

- `POST /api/leads/booking/create-order` (protected: customer)
  - Create Razorpay order for booking amount.  
  - Body: `{ property_id, amount }`
  - Backend:
    - Creates Razorpay order via API
    - Stores a `lead` with type `"booking"` + `razorpay_order_id` and status `"new"`
    - Returns: `{ order_id, amount, currency, razorpay_key }` (public key for frontend checkout).

- `POST /api/leads/booking/verify` (protected: customer)
  - Body: `{ lead_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }`
  - Verifies signature with Razorpay secret
  - Updates lead.status to `"completed"` on success.

### 4.6 Dashboards (simple aggregations)
- `GET /api/dashboard/customer` (protected: customer)
  - Customer’s leads, bookings, properties interacted with.

- `GET /api/dashboard/agent` (protected: agent)
  - Assigned properties
  - Leads assigned to that agent

- `GET /api/dashboard/franchise` (protected: franchise_owner)
  - Number of properties by status
  - Leads counts by status
  - Total booking amount sum

---

## 5. Frontend Pages & Flows

### 5.1 Public
- **Landing / Home** (`/`)
  - Branding as **Golasco Property**
  - Hero section with search filters (City, Type, Budget slider – for MVP we can use City + Type + Max Price)
  - Property cards list (from `/api/properties`)
  - Each card: title, city, price, type, status badge.
  - CTAs: “View details”, “Login / Register”.

- **Property Detail** (`/properties/:id`)
  - Full details from backend
  - Buttons:
    - `Book Site Visit` -> if not logged in as customer, redirect to login.
    - `Apply for Loan` -> simple lead form.
    - `Book Online` -> booking flow with Razorpay.

- **Auth**
  - `/login` – email/password
  - `/register` – only creates `customer` users (role fixed in frontend, not user‑selectable)

### 5.2 After Login – Role Based

Common: After successful login, redirect to role‑specific dashboard.

#### Customer Dashboard (`/dashboard/customer`)
- My Bookings & Leads list (table/cards)
- Quick actions: Continue payment (if any pending orders)

#### Agent Dashboard (`/dashboard/agent`)
- Assigned properties
- My leads
- Simple KPIs: total leads, completed bookings.

#### Franchise Owner Dashboard (`/dashboard/franchise`)
- Summary cards: total properties, available / booked / sold
- Total booking amount
- Agents list quick view
- Recent leads
- Buttons:
  - Add Property
  - Add Agent

### 5.3 Components & UI
- Use shadcn components for:
  - Buttons, Inputs, Select, Cards, Table, Tabs
- Color scheme (Tailwind classes):
  - Primary: `bg-emerald-700`, hover `bg-emerald-800`
  - Accent: `bg-amber-500`
  - Avoid center‑aligning whole app; use left‑aligned content with max‑width containers.
- Add `data-testid` to all interactive and key info elements.

---

## 6. Razorpay Integration Plan

Backend:
- Use official `razorpay` Python SDK if available; if not, use `requests` to call Razorpay REST
- Environment variables (to be added in `/app/backend/.env` – but NOT hardcoded in code):
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
- Service module to:
  - create_order(amount, receipt, notes)
  - verify_signature(order_id, payment_id, signature)

Frontend:
- Use Razorpay Checkout JS
  - Load script dynamically on booking
  - Use `razorpay_key` from backend response
  - On success, call `/api/leads/booking/verify`

Note: For now, we will assume you will provide real Razorpay test keys via environment (or keep placeholders and mark as TODO if keys are missing).

---

## 7. Testing Strategy

### Backend
- Unit‑level: basic tests for auth, property CRUD, lead creation, Razorpay order creation (mock Razorpay if needed)
- Manual via testing agent: hitting key endpoints

### Frontend
- Lint check via ESLint
- Testing agent with Playwright flows:
  - Register + login as customer
  - Browse properties
  - Start a booking (Razorpay popup flow will be smoke‑tested; full payment success might be simulated depending on test mode)

---

## 8. Implementation Phases

1) **Backend foundation**
   - Auth (register/login/me)
   - Models & CRUD for franchises, properties, leads
   - Basic dashboards

2) **Razorpay backend integration**
   - Env variables + simple create_order + verify_signature

3) **Frontend scaffolding**
   - Routing, layout, theme for Golasco Property
   - Auth pages
   - Public property listing & detail

4) **Role‑based dashboards**
   - Customer / Agent / Franchise owner

5) **Booking flow UI + Razorpay Checkout**

6) **Testing & polish**
   - Run linters
   - Run testing agent
   - Fix major issues
