# 🎓 MentorConnect

**MentorConnect** is a full-stack MERN mentorship platform connecting aspiring software engineers and students with experienced mentors from top technology companies. It features mentor search with multi-faceted filtering, mentorship request lifecycle management, real-time messaging with Socket.io, and 1:1 session scheduling.

---

## 🚀 Key Features

- **Authentication & Role-Based Access Control**:
  - Distinct student and mentor onboarding flows.
  - JWT-based authentication with protected frontend and backend routes.
  - Dynamic user profiles (education, expertise, domains, social links).

- **Mentor Discovery & Matching**:
  - Filter by domain (e.g. CSE Tech Doubt Solver, Mock Interviews, Career Counseling, System Design).
  - Search by skills (C++, Python, React, DSA, System Design, etc.), company, and minimum ratings.
  - Detailed mentor profile cards with experience level, bio, and hourly rates.

- **Mentorship Request Workflow**:
  - Students can submit mentorship requests specifying topics, duration, and goals.
  - Mentors can review incoming requests with the ability to **Accept** or **Reject**.
  - Students can monitor status (`pending`, `accepted`, `rejected`, `cancelled`) in real-time.

- **Real-Time Communication (Socket.io)**:
  - Instant direct messaging between matched mentors and students.
  - Multi-media file attachments (images, documents, PDFs) with preview modals.
  - Real-time typing indicators and unread message badges.

- **Sessions & Meetings**:
  - 1:1 mentorship session scheduling with format options (video, code review, mock interview).
  - Built-in session interface simulation with meeting timer, notes scratchpad, and controls.

- **Modern UI & Theme Support**:
  - Responsive desktop and mobile interface built with modern CSS and Lucide icons.
  - Persistent Light / Dark mode toggle.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: React 19 + Vite 8
- **Routing**: React Router v7
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Real-Time**: Socket.io Client
- **Styling**: Vanilla CSS (Custom design system & themes)

### Backend (`/server`)
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **WebSockets**: Socket.io (with media payload support)
- **Security**: Bcryptjs, JSON Web Tokens (JWT), CORS

---

## 📂 Project Structure

```text
MentorConnect/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── api/                # Axios instance with interceptors
│   │   ├── components/         # Modals, Navbar, ProtectedRoute, Layout
│   │   ├── context/            # AuthContext for global state
│   │   ├── pages/              # Landing, Auth, Dashboards, Chat, Sessions
│   │   └── socket.js           # Socket.io client instance
│   └── package.json
├── server/                     # Backend Express + Node.js API
│   ├── config/                 # Database connection
│   ├── controllers/            # Auth, Mentor, Request, Conversation controllers
│   ├── middleware/             # Auth & Role verification middleware
│   ├── models/                 # Mongoose schemas (User, Request, Message, etc.)
│   ├── routes/                 # Express API routes
│   ├── db_seed.js              # Mock mentor dataset seeder
│   └── index.js                # Server entry point & Socket.io handlers
├── .gitignore                  # Git ignore rules (node_modules, .env, dist)
└── README.md                   # Platform documentation
```

---

## ⚡ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or a local MongoDB instance
- [Git](https://git-scm.com/)

---

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration file by copying the example:
   ```bash
   cp .env.example .env
   ```
4. Fill in your environment variables in `.env`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```
5. *(Optional)* Seed initial mentor sample data:
   ```bash
   node db_seed.js
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start at `http://localhost:5000`.

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 🔒 Security Best Practices
- Never commit `.env` files to source control.
- Passwords are encrypted using salted `bcryptjs` before persisting to MongoDB.
- API endpoints are protected using JWT bearer tokens and role-based middleware.
