# Task Management API

A robust and real-time Task Management API built with Node.js (TypeScript), Express, MongoDB, Redis, and Socket.io. Features user authentication, task CRUD, filtering, sorting, pagination, RBAC, caching, and real-time updates.

## Features

* User Authentication (JWT - Signup, Login)
* Password Hashing (bcrypt)
* Protected Routes
* Task CRUD Operations (Create, Read, Update, Delete)
* Task Assignment to Users
* Task Prioritization (Low, Medium, High)
* Task Status Tracking (Pending, In Progress, Completed)
* Filtering (by status, priority, date range - *implement date range if needed*)
* Searching (by title)
* Pagination & Sorting
* Role-Based Access Control (Admin, User)
* Redis Caching for Task Lists
* Real-time Updates via WebSockets (Socket.io)
* Dockerized Environment
* Unit & Integration Tests (Setup provided)
* API Documentation (Setup for Swagger provided)

## Tech Stack

* **Backend:** Node.js, Express.js
* **Language:** TypeScript
* **Database:** MongoDB (with Mongoose ODM)
* **Caching:** Redis (with ioredis)
* **Real-time:** Socket.io
* **Authentication:** JSON Web Tokens (JWT)
* **Password Hashing:** bcrypt
* **Containerization:** Docker, Docker Compose
* **Testing:** Jest, Supertest, MongoDB Memory Server
* **API Documentation:** Swagger

## Prerequisites

* Node.js (v20 or later recommended)
* npm or yarn
* Docker & Docker Compose
* Git

## Setup & Installation

1.  **Clone the repository:**
    `````bash
    git clone https://github.com/Ken-Obieze/task-management.git
    cd task-management
    ```

2.  **Create Environment File:**
    find attached a sample environment file and fill in your details:
    ```bash
    # Server Configuration
    PORT=3000
    NODE_ENV=development

    # MongoDB Configuration
    MONGO_URI=mongodb://mongo:27017/task-management

    # JWT Configuration
    JWT_SECRET=jwt_secret
    JWT_EXPIRATION=24h

    # Redis Configuration
    REDIS_HOST=redis
    REDIS_PORT=6379

    # Bcrypt Configuration
    SALT_ROUNDS=10
    ```
    *Edit `.env` with your `MONGODB_URI`, `JWT_SECRET`, `REDIS_HOST`, etc.*

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

## Running the Application

**Development Mode (with Hot Reloading):**
```bash
npm run dev
```
The API will be available at http://localhost:<PORT> (default 3000).

**Production Mode:**
1. Build the TypeScript code
```bash
npm run build
```


2. Start the server
```bash
npm run start
```


**Running with Docker:**
Ensure Docker Desktop is running

1. Build and run containers in detached mode
```bash
docker-compose up --build -d
```

2. Stop containers
```bash
docker-compose down
```

3. View logs
```bash
docker-compose logs -f api
```
The API will be available at http://localhost:<PORT> (as defined in .env or docker-compose.yml).

**Running Tests**
1. All test
    ```bash
    npm test
    ```
2. Only unit test
    ```bash
    npm test:unit
    ```
3. Only integration test
    ```bash
    npm test:integration
    ```

## API Documentation
Swagger: You can access interactive documentation at http://localhost:<PORT>/api-docs.

## Authentication Routes
* POST /api/auth/signup - Register a new user.
* POST /api/auth/login - Login and get JWT token.

## Other Routes
* GET /api-docs - For swagger docs
* GET /health - For health check

## Tasks Routes
* POST /api/tasks - Create a new task (Requires Auth).
* GET /api/tasks - Get tasks (filtered, paginated, sorted) (Requires Auth).
* GET /api/tasks/:id - Get a specific task (Requires Auth).
* PUT /api/tasks/:id - Update a task (Requires Auth, Permissions Checked).
* DELETE /api/tasks/:id - Delete a task (Requires Auth, Permissions Checked)
