# Backend AI Agent Guidelines (`backend/AGENTS.md`)

This document defines the permanent engineering instructions, architectural standards, and operational rules for any AI coding agent or developer working inside the `backend/` directory.

---

## 1. Backend Architecture

* **Tech Stack**: Node.js + Express + TypeScript.
* **Database & ORM/ODM**: MongoDB + Mongoose.
* **API Style**: RESTful API architecture.
* **API Versioning**: Use a versioned API prefix (e.g., `/api/v1`).
* **Layered Organization**: Maintain clear separation between routes, controllers, services, models, middleware, and utilities:

```text
src/
├── config/       # Database connection, environment variable loaders
├── controllers/  # Request/response handlers (thin controllers)
├── middleware/   # Auth checks, validation, error handlers, rate limiters
├── models/       # Mongoose schemas and TypeScript document interfaces
├── routes/       # Express route definitions grouped by resource
├── services/     # Core business logic and database interactions
├── types/        # Custom TypeScript types and interfaces
├── utils/        # Helper functions, logger, response formatters
├── app.ts        # Express app initialization and middleware setup
└── server.ts     # HTTP server entry point and lifecycle handling
```

* **Targeted Structure**: Do not create every directory or file upfront until it is actually needed by a feature requirement.
* **Simplicity**: Avoid microservices or overly complex abstraction patterns. Keep the monolith clean, modular, and performant.

---

## 2. API Rules

* **RESTful Design**: Use standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with meaningful plural nouns (`/api/v1/buildings`, `/api/v1/guards`).
* **Consistent Responses**: Standardize success and error JSON response structures across all endpoints:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional user-friendly message"
  }
  ```
* **HTTP Status Codes**: Use precise HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).
* **Input Validation**: Validate all incoming parameters (`req.params`, `req.query`, `req.body`) at the controller/middleware layer before passing them to services.
* **Server-Side Enforcement**: Never trust client-provided authorization data or roles. Perform all identity and permission checks server-side.
* **Thin Controllers, Thick Services**: Keep controllers focused on HTTP concerns (parsing input, invoking services, returning responses). Put core business logic and Mongoose queries in services.

---

## 3. Database Rules

* **Database Engine**: MongoDB managed with Mongoose ODM.
* **Explicit Schemas**: Always define explicit Mongoose schemas with typed fields, required flags, defaults, and validation rules.
* **Indexing**: Define appropriate database indexes on frequently queried fields (e.g., `buildingId`, `guardId`, `createdAt`).
* **Entity Relationships**: Use standard Mongoose `ObjectId` references (`ref`) between related models rather than unmanaged string IDs.
* **Data Privacy**: Never store plain-text passwords or unnecessary sensitive personal data.
* **Clean Payloads**: Exclude internal Mongoose details (like `__v` or `password` fields) from API responses using schema transforms (`toJSON`) or query projections (`select('-password')`).

### Domain Model Entities (Future / Progressive Implementation)
Major entities that may be created as requirements demand:
* `User`
* `Building`
* `Guard`
* `Committee`
* `Attendance`
* `EntryLog`
* `Shift`
* `Salary`

*Do NOT create all model files upfront unless explicitly instructed for a specific feature task.*

---

## 4. Authentication & Authorization

When authentication is implemented:
* **Token-Based Security**: Use secure JWT (JSON Web Tokens) or session token authorization via `Authorization: Bearer <token>` headers.
* **Role-Based Access Control (RBAC)**: Supported user roles include:
  * `provider_admin`: System/platform administration across assigned providers and buildings.
  * `committee`: Management of specific building committee operations and guard assignments.
  * `guard`: Field operations, shift check-ins, visitor entry logging, and attendance.
* **Tenant & Scope Isolation**:
  * A `committee` user must **never** be permitted to access data belonging to another building.
  * A `guard` must **never** access another guard's private data or admin configurations.
  * Enforce scoping checks (`buildingId`, `userId`) on all database queries.

---

## 5. Security Rules

This is a security management backend that handles sensitive building and access records.

* **Secrets & Credentials**: Never hardcode database URIs, JWT secrets, or API keys. Always load them from process environment variables (`process.env`).
* **Data Protection**:
  * Never return user passwords or hash strings in API payloads.
  * Use strong password hashing (`bcrypt` / `argon2`) when auth is introduced.
* **Logging Safety**: Never log sensitive user payloads, passwords, or tokens to server console logs.
* **Environment Files**: Never commit `.env` files to git. Maintain `.env.example` with template keys only.
* **Middleware**: Use standard security headers (`helmet`), CORS configuration (`cors`), and sanitization middleware to prevent common web vulnerabilities.

---

## 6. Error Handling

* **Centralized Error Middleware**: Catch all uncaught operational errors through an Express global error handler middleware.
* **Predictable API Errors**: Return structured error payloads to clients:
  ```json
  {
    "success": false,
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "The requested building record was not found."
    }
  }
  ```
* **Production Sanitization**: Never leak raw database error stacks, SQL/Mongo internal messages, or system file paths in production HTTP responses.

---

## 7. Code Quality

* **Strict TypeScript**: Maintain strict typing for requests, responses, models, and service parameters. Avoid `any`.
* **File Size**: Keep controllers, routes, and services reasonably small and single-purposed.
* **Minimal Dependencies**: Keep external NPM dependencies minimal. Avoid pulling in unnecessary heavy libraries.
* **No Unneeded Complexity**: Maintain a straightforward REST API architecture. Do not introduce GraphQL, gRPC, or microservice buses without explicit product requirements.

---

## 8. AI Agent Rules

When asked to implement backend functionality inside `backend/`:

1. **Inspect Existing Code**: Review existing routes, models, and services first to maintain coding style and patterns.
2. **Follow Architecture**: Adhere strictly to the established layered design (`routes` -> `controllers` -> `services` -> `models`).
3. **No Duplicate Models/Routes**: Check if a model, route, or controller already exists before creating new ones.
4. **Preserve API Contracts**: Never change existing response formats or field names without verifying mobile app compatibility.
5. **Implement Requested Scope Only**: Focus solely on the user's specific request. Do not fabricate unrequested features or mock endpoints.
6. **Isolated Scope**: Do **NOT** modify files inside `app/` when working on a `backend/` task, unless explicitly requested.
7. **Boundary Input Validation**: Always validate request input at the API boundary before executing service operations.
8. **Enforce Authorization**: Consider tenant scoping and authorization checks for every protected endpoint.
9. **No Production Leaks**: Ensure error handling sanitizes internal stack traces and database details.
10. **Build Verification**: Always run `npm run build` inside `backend/` after making changes to verify there are no TypeScript compilation errors.
