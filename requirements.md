# Iron & Neon Gym Website - Requirements & Architecture

## Original Problem Statement
Design and develop a modern, responsive Gym Website with an Admin Membership Management System featuring:
- Public website (Home, Plans, Trainers, Contact)
- Admin Dashboard with member management
- Payment tracking with Cashfree gateway
- Reports and CSV exports

## User Choices
- Payment Gateway: Cashfree
- Theme: Dark energetic (red & black)
- Authentication: JWT-based
- Google Maps Integration: Yes
- Reports Export: CSV

## Architecture

### Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT tokens (72hr expiry)
- **Payment**: Cashfree Payment Gateway integration ready

### Directory Structure
```
/app
├── backend/
│   ├── server.py          # Main FastAPI app with all endpoints
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── PlansPage.jsx
│   │   │   ├── TrainersPage.jsx
│   │   │   ├── ContactPage.jsx
│   │   │   ├── PaymentSuccessPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLoginPage.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminMembers.jsx
│   │   │       ├── AdminPayments.jsx
│   │   │       └── AdminReports.jsx
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   └── components/ui/  # Shadcn components
│   └── package.json
└── test_reports/
```

### API Endpoints

#### Public APIs
- `GET /api/` - Health check
- `GET /api/plans` - Get membership plans
- `GET /api/trainers` - Get trainers
- `POST /api/contact/form` - Submit contact form

#### Admin Authentication
- `POST /api/admin/login` - Admin login (returns JWT)
- `GET /api/admin/me` - Get current admin info

#### Admin Member Management
- `GET /api/admin/members` - List all members
- `POST /api/admin/members` - Create member
- `PUT /api/admin/members/{id}` - Update member
- `DELETE /api/admin/members/{id}` - Delete member

#### Admin Payment Management
- `GET /api/admin/payments` - List all payments
- `POST /api/admin/payments/record` - Record manual payment

#### Payment Gateway (Cashfree)
- `POST /api/payment/create-order` - Create Cashfree order
- `GET /api/payment/verify/{order_id}` - Verify payment status
- `POST /api/payment/webhook` - Cashfree webhook handler

#### Reports
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/reports/members` - Members report
- `GET /api/admin/reports/payments` - Payments report

### Database Collections
- `admins` - Admin users
- `members` - Gym members
- `membership_plans` - Membership plans (Monthly, Quarterly, Yearly)
- `trainers` - Trainer profiles
- `payments` - Payment records
- `contact_messages` - Contact form submissions

### Demo Credentials
- **Admin Email**: admin@ironandneon.com
- **Admin Password**: admin123

## Tasks Completed
1. ✅ Public website with Home, Plans, Trainers, Contact pages
2. ✅ Admin authentication with JWT
3. ✅ Admin Dashboard with stats and charts
4. ✅ Member CRUD operations
5. ✅ Payment recording (manual)
6. ✅ Reports page with CSV export
7. ✅ Cashfree payment gateway integration (backend ready)
8. ✅ Google Maps on Contact page
9. ✅ Mobile-responsive design
10. ✅ Dark theme with red accents

## Next Tasks / Enhancements
1. Complete Cashfree frontend integration (checkout flow)
2. Email reminders for membership renewals
3. Member login portal
4. Attendance tracking
5. QR code check-in system
6. Multi-branch support
7. PDF export for reports
