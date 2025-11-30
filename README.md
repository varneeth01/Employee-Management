# Employee Attendance System

A modern, full-stack employee attendance tracking system with role-based access control. Employees can manage check-in/out with automatic status calculation, while managers can view team attendance, generate reports, and analyze patterns.

## Features

### Employee Features
- ✅ Check-in / Check-out with automatic timestamps
- ✅ View personal attendance history with calendar heatmap
- ✅ Monthly attendance statistics and trends
- ✅ Profile management and personal information

### Manager Features
- ✅ Real-time team attendance dashboard
- ✅ Team calendar view with attendance status
- ✅ Comprehensive attendance reports with filters
- ✅ CSV export for attendance data
- ✅ Department-level attendance analytics
- ✅ Employee performance tracking

### Technical Features
- 🔐 JWT-based authentication with role-based access control (RBAC)
- 🎨 Modern UI inspired by Linear and Notion
- 📱 Fully responsive design
- 🌓 Light and dark mode support
- 📊 Interactive charts and data visualization
- 💾 MongoDB persistence with in-memory fallback
- ⚡ Real-time updates with React Query

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- TailwindCSS + Shadcn UI
- TanStack Query (React Query) for state management
- Wouter for routing
- Recharts for data visualization

**Backend:**
- Express.js + TypeScript
- MongoDB with Mongoose
- JWT authentication
- Bcrypt for password hashing

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (optional - app falls back to in-memory storage)

### Quick Start

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   - `MONGODB_URI` - MongoDB connection string (optional)
   - `JWT_SECRET` or `SESSION_SECRET` - Secret key for token generation
   - `NODE_ENV` - Set to "development" or "production"

3. **Run the Application**
   ```bash
   npm run dev
   ```
   
   The app will start on `http://localhost:5000`

## How to Run

### Development Mode
```bash
npm run dev
```
- Vite dev server with hot reloading
- Express backend with nodemon
- Open `http://localhost:5000` in your browser

### Production Mode
```bash
npm run build
npm start
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run type-check` - Check TypeScript types

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance

# Authentication
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# Environment
NODE_ENV=development
PORT=5000
```

### Variable Details

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | - | No* |
| `JWT_SECRET` | Secret key for JWT tokens | Falls back to SESSION_SECRET | No** |
| `SESSION_SECRET` | Secret key for sessions | "attendance-system-secret-key" | No** |
| `NODE_ENV` | Environment mode | "development" | No |
| `PORT` | Server port | 5000 | No |

*If not provided, app uses in-memory storage (data won't persist)  
**At least one must be provided for secure token generation

## Demo Credentials

The application comes pre-seeded with demo users:

### Manager Account
- **Name:** Sarah Wilson
- **Email:** manager@example.com
- **Password:** password123
- **Role:** Manager
- **Employee ID:** MGR001

### Employee Accounts
| Name | Email | Password | Employee ID | Department |
|------|-------|----------|-------------|-----------|
| John Smith | employee1@example.com | password123 | EMP001 | Engineering |
| Emily Johnson | employee2@example.com | password123 | EMP002 | Sales |
| Michael Brown | employee3@example.com | password123 | EMP003 | Support |
| Jessica Davis | employee4@example.com | password123 | EMP004 | Engineering |
| David Martinez | employee5@example.com | password123 | EMP005 | Marketing |

**Note:** All accounts use password `password123`

## Database & Data Persistence

### MongoDB (Recommended for Production)
Set the `MONGODB_URI` environment variable to enable persistent storage:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance
```

### In-Memory Storage (Development)
If `MONGODB_URI` is not set, the app automatically falls back to in-memory storage. This is useful for:
- Local development without MongoDB setup
- Testing and demo purposes
- **Note:** Data will be lost when the server restarts

### Sample Data
The application automatically seeds demo data on first run:
- 1 Manager account
- 5 Employee accounts
- 2 weeks of sample attendance records with various statuses

## Project Structure

```
.
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   │   ├── auth/          # Login/Register pages
│   │   │   ├── employee/       # Employee dashboard, history, etc.
│   │   │   └── manager/        # Manager dashboard, reports, etc.
│   │   ├── context/            # React context (Auth, Theme)
│   │   ├── lib/                # Utilities and API client
│   │   ├── hooks/              # Custom React hooks
│   │   └── index.css           # Global styles
│   └── index.html
├── server/                      # Express backend
│   ├── routes.ts               # API routes
│   ├── storage.ts              # Data storage layer
│   ├── index.ts                # Server setup
│   └── vite.ts                 # Vite integration
├── shared/                      # Shared types and schemas
│   └── schema.ts               # Data models and validation
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/register` - Register new account

### Dashboards
- `GET /api/dashboard/employee` - Get employee dashboard stats
- `GET /api/dashboard/manager` - Get manager dashboard stats

### Attendance
- `POST /api/attendance/checkin` - Check in for the day
- `POST /api/attendance/checkout` - Check out for the day
- `GET /api/attendance/my-history` - Get personal attendance history
- `GET /api/attendance/today-status` - Get today's status
- `GET /api/attendance/all` - Get all attendance (manager only)
- `GET /api/attendance/today-status` - Get team status for today (manager only)

### Users
- `GET /api/users/me` - Get current user info
- `GET /api/users/employees` - Get all employees (manager only)
- `PUT /api/users/:id` - Update user profile

## Usage Guide

### For Employees

1. **Login** with your email and password
2. **Dashboard** shows your current status and monthly stats
3. **Mark Attendance** to check in/out for the day
4. **My History** displays your attendance records with a heatmap
5. **Profile** to manage your personal information

### For Managers

1. **Login** with manager credentials
2. **Dashboard** shows team overview and trends
3. **All Attendance** lists all employee attendance records
4. **Team Calendar** shows employee availability by date
5. **Reports** with filtering and CSV export capability

## Troubleshooting

### Port Already in Use
If port 5000 is in use, set a different port:
```bash
PORT=5001 npm run dev
```

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check network connectivity
- App will automatically fallback to in-memory storage
- Check console logs for detailed error messages

### Authentication Issues
- Clear browser localStorage (removes cached token)
- Ensure `JWT_SECRET` or `SESSION_SECRET` is set
- Token expires after 7 days

### Data Not Persisting
- If no MongoDB URI is set, data is lost on server restart
- Set `MONGODB_URI` to persist data

## Performance Considerations

- **Query Caching:** React Query caches attendance data to reduce API calls
- **Real-time Updates:** Calendar updates automatically when attendance changes
- **CSV Export:** Manager reports can export large datasets efficiently
- **Database Indexing:** MongoDB indexes optimize common queries

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token authentication (7-day expiration)
- ✅ Role-based access control (RBAC)
- ✅ Protected API routes
- ✅ Input validation with Zod schemas
- ✅ XSS protection via React sanitization

## Contributing

Pull requests are welcome! Please ensure:
- TypeScript types are correct
- Components follow Shadcn UI patterns
- Tests pass before submitting
- Code follows existing style conventions

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs in browser console
3. Check server logs in terminal
4. Verify environment variables are set correctly

---

**Built with Modern Web Technologies** ⚡
