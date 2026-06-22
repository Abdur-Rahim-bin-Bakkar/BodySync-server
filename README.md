# 🏋️ BodyAsync Backend API

A robust and scalable backend service for the **BodyAsync Fitness & Gym Management Platform**, built with **Node.js**, **Express.js**, and **MongoDB**. This backend powers a complete fitness management ecosystem where users can explore classes, book fitness programs, participate in community forums, apply as trainers, manage favorites, and interact with role-based dashboards.

The system supports three different user roles:

- 👤 User
- 🧑‍🏫 Trainer
- 👑 Admin

Each role has dedicated permissions and access control implemented through middleware-based authorization.

---

# 📖 Table of Contents

- Project Overview
- Features
- Technology Stack
- Architecture Overview
- User Roles
- Database Collections
- Authentication & Authorization
- API Endpoints
- Classes Module
- Bookings Module
- Favorites Module
- Forum Module
- Comments & Replies Module
- Reactions Module
- Trainer Application Module
- User Management Module
- Dashboard Statistics Module
- Environment Variables
- Installation Guide
- Running the Project
- Error Handling
- Security Features
- Future Improvements
- License

---

# 🚀 Project Overview

BodyAsync is a complete Fitness & Gym Management Platform backend designed to manage fitness classes, trainer applications, bookings, community discussions, and administrative operations.

The platform enables:

- Trainers to create and manage fitness classes.
- Users to discover and book classes.
- Users to save favorite classes.
- Community interaction through forums.
- Admins to control users, trainers, classes, and platform-wide activities.
- Real-time statistics and analytics for dashboards.

---

# ✨ Features

## Authentication & Authorization

- Session-based token verification
- Protected routes
- Role-based authorization
- Admin-only access control
- Trainer-only access control
- Shared Admin/Trainer permissions
- Blocked user restrictions

---

## User Features

- Browse approved classes
- Search classes
- Filter classes by category
- Book classes
- Save favorite classes
- Join community discussions
- Comment on forum posts
- Reply to comments
- Like or dislike forum posts
- Apply as a trainer

---

## Trainer Features

- Create classes
- Update classes
- Delete classes
- View enrolled students
- Create forum posts
- Manage forum content
- Access trainer dashboard analytics

---

## Admin Features

- Approve classes
- Reject classes
- Remove classes
- Promote users to admin
- Block users
- Unblock users
- Review trainer applications
- Approve trainer applications
- Reject trainer applications
- Remove trainer roles
- Access platform statistics

---

# 🛠 Technology Stack

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- MongoDB Native Driver

## Middleware

- CORS
- Express JSON Parser

## Authentication

- Session Collection
- Token Verification Middleware

## Environment Configuration

- dotenv

---

# 🏗 Architecture Overview

The backend follows a modular API-driven architecture.

```text
Client
   │
   ▼
Express Server
   │
   ├── Authentication Middleware
   ├── Authorization Middleware
   ├── Route Handlers
   └── MongoDB Collections
           │
           ▼
       MongoDB Database
```

---

# 👥 User Roles

## User

Permissions:

- View classes
- Book classes
- Add favorites
- Create comments
- Reply to comments
- Apply as trainer

---

## Trainer

Permissions:

- All User permissions
- Create classes
- Update classes
- Delete own classes
- Create forum posts
- View enrolled students

---

## Admin

Permissions:

- Full system access
- Manage users
- Manage trainers
- Approve classes
- Reject classes
- View analytics
- Manage applications

---

# 🗄 Database Collections

The application uses the following collections:

## users

Stores:

- Name
- Email
- Profile Image
- Role
- Status
- Login Information

---

## classes

Stores:

- Class Name
- Category
- Trainer Information
- Booking Count
- Difficulty Level
- Price
- Status

---

## bookings

Stores:

- User Information
- Class Information
- Booking Date
- Transaction Information

---

## forum

Stores:

- Forum Posts
- Author Information
- Reactions
- Comment Counts

---

## comments

Stores:

- Forum Comments

---

## commentreplay

Stores:

- Replies to comments

---

## favorites

Stores:

- User favorite classes

---

## applyastrainer

Stores:

- Trainer applications

---

## session

Stores:

- Login session tokens

---

# 🔐 Authentication & Authorization

## verifyToken

Validates:

- Authorization header
- Session token existence
- User existence

Used for:

- Protected routes

---

## verifyTrainer

Allows access only to trainers.

---

## verifyAdmin

Allows access only to admins.

---

## verifyAdminOrTrainer

Allows access to:

- Admin
- Trainer

---

# 📚 API Documentation

---

# 🏋️ Classes APIs

## Create Class

```http
POST /class
```

Access:

```text
Trainer Only
```

---

## Get Featured Classes

Returns top 4 approved classes sorted by booking count.

```http
GET /classes/featured
```

---

## Get All Classes

Supports:

- Pagination
- Search
- Category Filter

```http
GET /classes?page=1&limit=6
```

Example:

```http
GET /classes?page=1&limit=6&search=yoga&category=Yoga
```

---

## Get Trainer Classes

```http
GET /classes/:userId
```

---

## Get Class Details

```http
GET /classes/:id/details
```

---

## Update Class

```http
PATCH /classes/:id
```

---

## Delete Class

```http
DELETE /classes/:id
```

---

## Approve Class

```http
PATCH /classes/:id/approve
```

Admin Only

---

## Reject Class

```http
PATCH /classes/:id/reject
```

Admin Only

---

## Increment Booking Count

```http
PATCH /classes/:id/increment-booking
```

---

## Get Class Students

```http
GET /classes/:id/students
```

---

# 📅 Booking APIs

## Create Booking

```http
POST /bookings
```

---

## Check Existing Booking

```http
GET /bookings/user/:userId/class/:classId
```

---

## Get User Bookings

```http
GET /bookings/user/:userId
```

---

# ❤️ Favorite APIs

## Toggle Favorite

```http
POST /favorites/toggle
```

Automatically:

- Adds favorite
- Removes favorite

---

## Check Favorite Status

```http
GET /favorites/check
```

Query:

```text
userId
classId
```

---

## Get Favorites

```http
GET /favorites/:userId
```

---

## Delete Favorite

```http
DELETE /favorites/:id
```

---

# 💬 Forum APIs

## Create Forum Post

```http
POST /forum
```

Trainer/Admin Only

---

## Get Latest Posts

```http
GET /forum/latest
```

---

## Get All Posts

```http
GET /forum-posts
```

Supports:

```text
Search
```

---

## Get Single Post

```http
GET /forum-posts/:id
```

---

## Delete Post

```http
DELETE /forum/:id
```

---

# 💭 Comment APIs

## Add Comment

```http
POST /forum/:id/comment
```

---

## Get Comments

```http
GET /forum/:id/comments
```

---

## Update Comment

```http
PATCH /comments/:id
```

---

## Delete Comment

```http
DELETE /comments/:id
```

---

# 💬 Reply APIs

## Add Reply

```http
POST /comment/:commentId/reply
```

---

## Get Replies

```http
GET /comment/:commentId/replies
```

---

# 👍 Reaction APIs

## Like / Dislike Post

```http
POST /post/reaction
```

Supported Types:

```json
{
  "type": "like"
}
```

```json
{
  "type": "dislike"
}
```

Features:

- Toggle reaction
- Remove previous reaction
- Update counts

---

# 🧑‍🏫 Trainer Application APIs

## Apply as Trainer

```http
POST /apply-trainer
```

---

## Get Application Status

```http
GET /apply-trainer/:userId
```

---

## Get All Applications

```http
GET /apply-trainer
```

Admin Only

---

## Approve Application

```http
PATCH /apply-trainer/:id/approve
```

Automatically:

- Updates application status
- Updates user role to trainer

---

## Reject Application

```http
PATCH /apply-trainer/:id/reject
```

Automatically:

- Updates application status
- Resets user role

---

# 👤 User APIs

## Sync User

```http
POST /users/sync
```

Creates user automatically on first login.

---

## Get All Users

```http
GET /users
```

Supports:

```text
Email Search
```

Admin Only

---

## Get Single User

```http
GET /users/:id
```

---

## Block / Unblock User

```http
PATCH /users/:id/status
```

---

## Promote User To Admin

```http
PATCH /users/:id/make-admin
```

---

## Remove Trainer Role

```http
PATCH /users/:id/remove-trainer
```

---

# 📊 Dashboard Statistics APIs

## User Statistics

```http
GET /users/:userId/stats
```

Returns:

- Booking Count
- Favorite Count

---

## Trainer Statistics

```http
GET /users/:userId/total-stats
```

Returns:

- Total Classes
- Total Bookings
- Total Forum Posts

---

## Admin Overview Statistics

```http
GET /admin/overview-stats
```

Returns:

- Total Users
- Total Classes
- Total Bookings
- Total Forum Posts
- Total Comments
- Total Trainer Applications

---

## Transactions

```http
GET /transactions
```

Returns:

- Payment History
- Transaction Records

---

## Trainers List

```http
GET /trainers
```

Returns:

- All Active Trainers

---

# ⚙️ Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

---

# 📥 Installation

Clone the repository:

```bash
git clone <repository-url>
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Running The Application

Development:

```bash
npm run dev
```

or

```bash
nodemon index.js
```

Production:

```bash
node index.js
```

---

# 🛡 Security Features

- Route Protection
- Role-Based Access Control
- Session Verification
- Duplicate Trainer Application Prevention
- Favorite Duplication Prevention
- ObjectId Validation
- Blocked User Restriction
- Protected Dashboard Routes

---

# 📈 Future Improvements

- Stripe Payment Integration
- SSLCommerz Integration
- JWT Verification Upgrade
- Refresh Token System
- Real-Time Notifications
- Email Verification
- Password Authentication
- Socket.IO Chat System
- Admin Activity Logs
- Analytics Dashboard Enhancements
- Report System
- Content Moderation

---

# 📄 License

This project was developed for educational purposes and portfolio demonstration.

---

# 👨‍💻 Developer

Backend developed using:

- Node.js
- Express.js
- MongoDB

as part of the BodyAsync Fitness & Gym Management Platform.