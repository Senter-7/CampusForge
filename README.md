# CampusForge - Academic Collaboration Platform

A full-stack web application designed to help college students seamlessly form teams, manage projects, and share ideas within their academic community.

## 🚀 Features

### User Management
- JWT-based authentication and authorization
- Role-based access control (Student, Professor, Admin)
- User profiles with skills, interests, and availability
- University-based user organization

### Project Management
- Create and manage collaborative projects
- Project status tracking (Open, Ongoing, Completed)
- Skill-based project requirements
- Project member management with roles
- Collaboration requests system

### Teammate Discovery
- Advanced search and filtering
- Filter by skills, major, year, and availability
- Online/offline status tracking
- User rating and project count display

### Course & Professor Rating
- Rate professors and courses (1-5 stars)
- Written reviews and comments
- Average rating calculations
- Public rating display

### Task Management
- Task creation and assignment
- Task status tracking
- Priority levels
- Task comments and discussions

### Real-time Communication
- WebSocket-based messaging
- Project-based group chats
- Real-time message delivery

### Notifications
- User notifications
- Read/unread status tracking

## 🛠️ Technologies

### Backend
- **Java 17**
- **Spring Boot 3.5.5**
- **Spring Security** (JWT Authentication)
- **Spring Data JPA**
- **MySQL**
- **Maven**
- **WebSocket**

### Frontend
- **React 18**
- **TypeScript**
- **Vite**
- **React Router**
- **Axios**
- **React Hook Form**
- **TanStack Query**
- **Tailwind CSS**
- **Radix UI**
- **Shadcn UI**

## 📁 Project Structure

```
CampusForge/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/campusconnect/
│   │       ├── controller/  # REST API endpoints
│   │       ├── service/     # Business logic
│   │       ├── repository/  # Data access
│   │       ├── entity/      # JPA entities
│   │       ├── dto/         # Data transfer objects
│   │       ├── security/    # Authentication
│   │       └── config/      # Configuration
│   └── pom.xml
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/            # API client
│   │   ├── routes/         # Routing
│   │   └── utils/          # Utilities
│   └── package.json
└── complete_schema.sql      # Database schema
```

## 🗄️ Database Schema

The application uses a MySQL database with 15+ tables including:
- Users, Skills, Interests
- Projects, Project Members, Tasks
- Professors, Courses, Course Details
- Ratings, Reviews
- Messages, Notifications
- Universities, Attachments

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8+
- Maven 3.8+

### Backend Setup
1. Navigate to the backend directory
2. Update `application.properties` with your database configuration
3. Run the database schema from `complete_schema.sql`
4. Build and run:
```bash
mvn clean install
mvn spring-boot:run
```

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Users can register and login to receive a JWT token that is used for subsequent API requests.

## 📝 API Endpoints

### Public Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/projects` - Get all projects
- `GET /api/professors` - Get all professors
- `GET /api/courses` - Get all courses
- `GET /api/users/teammates` - Get teammates

### Protected Endpoints
- `GET /api/users/{id}` - Get user profile
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `POST /api/ratings` - Create rating
- `GET /api/messages/{projectId}` - Get messages
- And more...

## 🎨 UI Components

The frontend uses Shadcn UI components built on Radix UI primitives, providing:
- Accessible components
- Responsive design
- Dark mode support (if configured)
- Consistent styling with Tailwind CSS

## 🔒 Security Features

- JWT token-based authentication
- Password encryption with BCrypt
- Role-based access control
- CORS configuration
- SQL injection prevention (JPA)
- XSS protection

## 📊 Key Metrics

- **20+ REST API endpoints**
- **15+ database tables**
- **30+ service classes**
- **50+ React components**
- **15+ page components**

## 🤝 Contributing

This is a portfolio project. Feel free to fork and extend it for your own purposes.

## 📄 License

This project is for educational and portfolio purposes.


## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- React team for the amazing library
- Shadcn UI for the beautiful components
- All open-source contributors

