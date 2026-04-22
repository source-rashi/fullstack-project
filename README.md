# MERN Stack Hospital Management System

This repository contains three apps:

- `backend`: Node.js + Express API
- `frontend`: Patient/Doctor portal (Vite + React)
- `dashboard`: Admin portal (Vite + React)

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB running on `mongodb://127.0.0.1:27017`

## 1) Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../dashboard && npm install
```

## 2) Backend Environment

Backend reads `backend/config.env`.

Required values:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET_KEY`
- `JWT_EXPIRES`
- `COOKIE_EXPIRE`

Optional value:

- `MONGO_DB_NAME` (defaults to `MERN_STACK_HOSPITAL_MANAGEMENT_SYSTEM_DEPLOYED`)
- `APPOINTMENT_ALLOW_UNKNOWN_DOCTOR` (defaults to enabled for local mock-booking flow)

If you want explicit control over typed-doctor booking (demo-safe mode), set:

- `APPOINTMENT_ALLOW_UNKNOWN_DOCTOR=true` in `backend/config.env`
- `VITE_APPOINTMENT_ALLOW_UNKNOWN_DOCTOR=true` in `frontend/.env`

To force strict mode (reject unknown doctor names), set both values to `false`.

Default local CORS values in config:

- `FRONTEND_URL_ONE=http://localhost:5173`
- `FRONTEND_URL_TWO=http://localhost:5174`

## 3) Bootstrap First Admin (One-Time)

From `backend`:

```bash
npm run bootstrap:admin
```

Default generated admin credentials:

- Email: `admin@hms.local`
- Password: `Admin@12345`

You can override defaults with env vars in `config.env`:

- `BOOTSTRAP_ADMIN_FIRST_NAME`
- `BOOTSTRAP_ADMIN_LAST_NAME`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_ADMIN_PHONE`
- `BOOTSTRAP_ADMIN_NIC`
- `BOOTSTRAP_ADMIN_DOB`
- `BOOTSTRAP_ADMIN_GENDER`

## 4) Run Apps (4 Terminals)

Terminal 1 (MongoDB):

```bash
mongod
```

Terminal 2 (Backend):

```bash
cd backend
npm run dev
```

Terminal 3 (Frontend):

```bash
cd frontend
npm run dev
```

Terminal 4 (Dashboard):

```bash
cd dashboard
npm run dev
```

Expected local URLs:

- Frontend: `http://localhost:5173`
- Dashboard: `http://localhost:5174`
- Backend: `http://localhost:4000`

## 5) Test Commands

```bash
cd backend && npm test
cd ../frontend && npm test
cd ../dashboard && npm test
```

Backend integration tests automatically use isolated DB name:

- `MERN_STACK_HOSPITAL_MANAGEMENT_SYSTEM_TEST`

## Quick Verification Checklist

- Patient can register and login from frontend
- Patient can create and cancel pending appointments
- Doctor can login and view doctor appointments
- Admin can login from dashboard
- Admin can add new admin and add new doctor
- Admin can view/update/delete appointments
- Admin can view messages
