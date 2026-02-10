# 🪷 HindustanOnhi — Premium Indian Ethnic Fashion E-Commerce

A full-stack, production-ready e-commerce platform for Indian ethnic fashion — sarees, kurtis, lehengas, dupattas, and festive wear.

---

## 🛠 Tech Stack

| Layer        | Technology                      |
|--------------|----------------------------------|
| Frontend     | React.js (Vite)                 |
| Backend      | Node.js + Express.js            |
| Database     | MongoDB (Mongoose ODM)          |
| Auth         | JWT (JSON Web Tokens)           |
| Payments     | Razorpay                        |
| Chatbot      | AI-powered (OpenAI / Rule-based)|

---

## 📁 Project Structure

```
HindustanOnhi/
├── backend/
│   ├── config/          # DB, env config
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helpers, chatbot logic
│   ├── seed/            # Sample data seeder
│   ├── server.js        # Entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context (Auth, Cart)
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # API client, helpers
│   │   ├── assets/      # Images, icons
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (for payments)
- OpenAI API key (optional, for AI chatbot)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` in the backend folder and fill in your values:

```bash
cp backend/.env.example backend/.env
```

### 3. Seed Sample Data

```bash
cd backend
npm run seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

### 5. Open in Browser

Visit `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role   | Email              | Password   |
|--------|--------------------|------------|
| Admin  | adm| admin123 |
| User   | priya@example.com  | user123    |

---

## 💳 Razorpay Test Cards

Use Razorpay test mode credentials. Test card: `4111 1111 1111 1111`

---

## 📦 Deployment

- **Frontend** → Vercel (`npm run build` then deploy `dist/`)
- **Backend** → Render (set env vars, start command: `npm start`)

---

## ✨ Features

- 🏠 Beautiful home page with hero, collections, categories
- 🛍 Product listing with filters & sorting
- 📸 Product detail with image gallery & size selector
- 🛒 Cart & Checkout with Razorpay payments
- 👤 User dashboard (orders, profile, addresses)
- ❤️ Wishlist
- 🤖 AI Chatbot (product help, size guide, delivery info)
- 🔐 JWT Authentication
- 📱 Mobile-first responsive design
- 🎨 Elegant ethnic Indian theme

---

Built with 🪷 for HindustanOnhi
