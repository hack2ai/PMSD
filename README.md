# 🎓 PMSD - Professional Master Skill Development

<p align="center">
  <img src="assets/pmsd-logo.png" width="170" alt="PMSD Logo"/>
</p>

<h3 align="center">
A Modern Full Stack Learning Management System (LMS)
</h3>

<p align="center">
Built using React, Node.js, Express.js, PostgreSQL, JWT Authentication, PDFKit & QR Code Verification.
</p>

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![License](https://img.shields.io/badge/Status-Under_Development-success)

</p>

---

# 📖 Project Overview

PMSD (Professional Master Skill Development) is a complete Learning Management System (LMS) built with a modern full-stack architecture.

The platform enables users to:

- Register and log in securely
- Browse and enroll in courses
- Track enrolled courses
- View payment history
- Download professionally generated PDF certificates
- Verify certificates using QR codes
- Manage their learning dashboard

The backend follows the **MVC architecture** and exposes RESTful APIs that can be consumed by the React frontend.

---

# 📑 Table of Contents

- Project Features
- Tech Stack
- System Architecture
- Folder Structure
- Database
- REST APIs
- Security Features
- Installation
- Screenshots
- Project Progress
- Future Improvements
- Developer

---

# ✨ Features

## 🔐 Authentication

- User Registration
- Secure Login
- JWT Authentication
- Password Encryption using bcrypt
- Protected Routes
- Role-based Authorization

---

## 👤 User Management

- User Profile
- Profile Update
- Profile Image Upload

---

## 📚 Course Management

- Create Courses
- Update Courses
- Delete Courses
- Course Details
- Course Listing

---

## 🎯 Enrollment

- Enroll in Courses
- View My Courses
- Enrollment History

---

## 💳 Payments

- Payment Records
- Payment History
- Purchase Tracking

---

## 🏆 Certificates

- Automatic PDF Certificate Generation
- Professional Certificate Layout
- Unique Certificate Number
- QR Code Generation
- Download Certificate

---

## ✅ Certificate Verification

- Public Certificate Verification
- QR Code Verification
- Certificate Authenticity Check

---

## 📊 Dashboard

Dashboard includes:

- Total Enrolled Courses
- Total Certificates
- Total Payments
- Recent Courses
- Recent Certificates
- Payment History

---

# 🛠 Tech Stack

## Frontend

- React 19
- React Router DOM
- Axios
- Vite

---

## Backend

- Node.js
- Express.js
- JWT
- bcrypt
- Multer
- PDFKit
- QRCode

---

## Database

- PostgreSQL

---

# 🏗 System Architecture

```
                React + Vite
                      │
               React Router DOM
                      │
                  Axios API
                      │
               Express.js Backend
                      │
          Authentication Middleware
                      │
              PostgreSQL Database
                      │
 PDF Generator + QR Certificate System
```

---

# 📂 Project Structure

```
PMSD
│
├── assets
│
├── backend
│   ├── src
│   │
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── utils
│   └── certificates
│
├── frontend
│   ├── src
│   │
│   ├── components
│   ├── context
│   ├── pages
│   ├── routes
│   └── services
│
└── README.md
```

---

# 🗄 Database

Tables Used

- Users
- Courses
- Enrollments
- Payments
- Certificates

---

# 🔗 REST API Endpoints

## Authentication

```
POST /api/auth/register
POST /api/auth/login
```

---

## Users

```
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

---

## Courses

```
GET    /api/courses
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id
```

---

## Enrollment

```
POST /api/enrollments
GET  /api/enrollments
```

---

## Payments

```
POST /api/payments
GET  /api/payments
```

---

## Certificates

```
POST /api/certificates
GET  /api/certificates
GET  /api/certificates/verify/:certificateNumber
```

---

## Dashboard

```
GET /api/dashboard

GET /api/dashboard/my-courses

GET /api/dashboard/my-certificates

GET /api/dashboard/payment-history
```

---

# 🔐 Security Features

- JWT Authentication
- Password Hashing
- Authorization Middleware
- Protected APIs
- Secure File Upload
- QR Verification
- Certificate Validation

---

# 💼 Skills Demonstrated

- Full Stack Development
- React Development
- Node.js Development
- Express.js REST APIs
- PostgreSQL Database Design
- JWT Authentication
- MVC Architecture
- PDF Generation
- QR Code Generation
- File Upload Management
- RESTful API Design

---

# 📦 Major Packages

## Backend

- express
- pg
- jsonwebtoken
- bcrypt
- multer
- pdfkit
- qrcode
- dotenv

---

## Frontend

- react
- react-router-dom
- axios
- vite

---

# 📸 Screenshots

> Screenshots will be added after the frontend UI is completed.

Expected Screenshots

- Login
- Register
- Dashboard
- Courses
- Certificates
- Payment History
- Certificate Verification

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/hack2ai/PMSD.git
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🌐 Default URLs

Backend

```
http://localhost:5001
```

Frontend

```
http://localhost:5173
```

---

# 📈 Project Progress

### Backend

- [x] Authentication
- [x] Users
- [x] Courses
- [x] Enrollments
- [x] Payments
- [x] Dashboard
- [x] PDF Certificate
- [x] QR Verification

---

### Frontend

- [x] React Setup
- [x] Routing
- [x] API Service Layer
- [x] Project Structure
- [ ] Login UI
- [ ] Register UI
- [ ] Dashboard UI
- [ ] Responsive Design
- [ ] Admin Panel

---

# 🎯 Future Improvements

- Stripe Payment Gateway
- Email Notifications
- Course Videos
- Quiz Module
- Assignment Submission
- Admin Analytics Dashboard
- Dark Mode
- Mobile Responsive Design
- Docker Deployment
- Cloud Hosting

---

# 👨‍💻 Developer

## Pankaj Kumar

**B.Tech – Computer Science Engineering**

### Skills

- Full Stack Developer
- React.js
- Node.js
- Express.js
- PostgreSQL
- REST APIs
- JWT Authentication

---

# 📄 License

This project is developed for educational, learning, and portfolio purposes.

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

---

<p align="center">

Made with ❤️ by <strong>Pankaj Kumar</strong>

</p>