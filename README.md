# आवाज (Avaaj) - Student Grievance Cell & Campus Maintenance Ticket System

> **Team 21 · Track 4: Maintenance Ticket System (FixIt Module)**  
> Built strictly following the CampusOS API specification and wireframe hand-drawn designs.

---

## 🌟 Overview & Architecture

**आवाज (Avaaj)** is a full-stack MERN application with separate frontend and backend architectures:
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Multer for image proof uploads, Morgan logging.
- **Frontend**: React, Vite, Lucide Icons, modern Vanilla CSS design system with custom properties, glassmorphism, responsive desktop view, and a realistic **Mobile Phone Frame View** faithfully replicating the hand-drawn wireframe sketches (Pages 1 to 7).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v25)
- **MongoDB**: Running locally on `mongodb://127.0.0.1:27017`

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed     # Seeds users, issue types, initial complaints, and notifications
npm start        # Starts Express API on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Starts Vite React dev server on http://localhost:5173
```

---

## 🔑 Demo Institutional Accounts (Team 21)

All accounts belong to the institution domain `@team21.com` with the shared team OTP: **`730792`**.  
The top bar in the app provides **1-Click Instant Role Switching** between:

| Role | Name | Email ID | Team OTP | Department / Designation |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Asha Kumar | `asha@team21.com` | `730792` | CSE (`USN: 1CF24CS001`) |
| **Campus Maintenance (CM)** | Kumar Gowda | `kumar@team21.com` | `730792` | Campus Maintenance / Supervisor |
| **Admin** | Admin Officer | `admin@team21.com` | `730792` | Institutional Administration |

---

## 📱 Wireframe-to-Screen Mapping

| Wireframe Sketch | App Feature / Screen | Description |
| :--- | :--- | :--- |
| **Page 1 & 2 (Top)** | **Welcome & Role Selector** | Logo "आवाज" with megaphone insignia, Student Grievance Cell branding, buttons for Admin, Student, CM. |
| **Page 2 (Bottom)** | **Student Dashboard** | Total Complaints (31), Complaints Solved (25), In Progress, Reviews & Feedback tiles, Help footer (`help: abc@gmail.com`). |
| **Page 3 (Top)** | **Raise Complaint & Success** | Name, Mobile, Category dropdown, Title, Description, Image Upload -> "Complaint Registered Successfully, Track ID: TKT-xxxxx". |
| **Page 3 (Bottom)** | **Track Complaint** | Search Track ID -> Step-by-Step Timeline (Registered ➔ In Progress ➔ Completed / Resolved ➔ Acknowledged). |
| **Page 4 (Top) & 6** | **Notifications** | Live maintenance updates, status changes, and TAT alerts. |
| **Page 4 (Bottom) & 5**| **Admin Console & Dashboard**| Metrics (Total 55, Solved 21, In Progress 14), Category charts, New Complaints list, Status update modal. |
| **Page 6 (Top)** | **Existing Complaints** | Filterable archive of completed and acknowledged maintenance tickets. |
| **Page 7 (Top)** | **Assign CM** | Assign complaint ID to maintenance supervisor/technician. |
| **Page 7 (Bottom)** | **CM Workboard** | Task 1, Task 2 list -> Task detail, TAT date picker, status update (In Progress / Solved), proof photo upload. |

---

## 🛠️ Implemented API Endpoints (CampusOS FixIt Spec)

### Auth (`/api/v1/auth`)
- `POST /admin/login` - Admin login (`email_id`, `otp`)
- `POST /login` - Student & Staff login (`email_id`, `otp`)
- `GET /api/v1/users/me` - Authenticated user profile
- `GET /api/v1/admin/me` - Authenticated admin profile

### FixIt Maintenance Tickets (`/api/v1/fixit`)
- `POST /tickets` - Raise complaint with multipart photo attachment (max 5MB)
- `GET /tickets` - Filter by `status`, `issue_type_id`, `mine`, `search`, and cursor pagination
- `GET /tickets/track/:ticket_id` - Public / fast track lookup by Track ID
- `GET /tickets/:ticket_id` - Full ticket details with timeline & assigned CM
- `PATCH /tickets/:ticket_id` - Reporter edit while open
- `DELETE /tickets/:ticket_id` - Reporter (while open) or Admin / CM delete
- `PUT /tickets/:ticket_id/status` - CM / Admin update status (`open` / `resolved`) with note (1-280 chars) and proof photo
- `POST /tickets/:ticket_id/acknowledge` - Reporter confirms fix and closes ticket
- `PUT /tickets/:ticket_id/tat` - Set Turnaround Time (`expected_by: YYYY-MM-DD`, auto overdue detection)
- `POST /tickets/:ticket_id/assign` - Assign CM staff to ticket

### Issue Types (`/api/v1/fixit/issue-types`)
- `GET /issue-types` - Fetch active categories (Electrical, Plumbing, Furniture, IT & Network, etc.)
- `POST /issue-types` - Create new category
- `DELETE /issue-types/:id` - Delete category

### Admin Management (`/api/v1/admin`)
- `GET /stats` - Aggregated campus complaints statistics
- `GET /users` - List institutional users with OTPs
- `POST /users` - Create student, faculty, or office staff
- `DELETE /users/:email_id` - Delete user

### Notifications & Feedback (`/api/v1`)
- `GET /notifications` - Fetch user/role notifications
- `POST /notifications/:id/read` - Mark notification as read
- `GET /feedbacks` - Fetch campus reviews
- `POST /feedbacks` - Post review with star rating
