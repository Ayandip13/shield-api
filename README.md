# SecuShield Security Management Backend

Production-ready RESTful API for building security, personnel management, visitor logging, and attendance tracking.

## Technology Stack

- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs password hashing

## Required Environment Variables

The backend requires the following environment variables configured in `.env`:

```env
NODE_ENV=production|development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/secushield
JWT_SECRET=<strong-unique-random-secret>
CORS_ORIGIN=https://app.yourcompany.com
```

### Environment Rules & Production Safeguards

1. **Production Fail-Fast**: If `NODE_ENV=production` is set, the backend will refuse to start if using localhost MongoDB URIs or default development JWT secrets.
2. **Seeding Safety**: Production data seeding via `npm run seed` is blocked by default and requires explicit `ALLOW_PRODUCTION_SEED=true`.
3. **Log Sanitization**: Sensitive parameters (passwords, hashes, tokens, auth headers) are automatically masked in log outputs.

## Development Commands

```bash
# Start development server with tsx watch
npm run dev

# Seed development database with demo data
npm run seed

# Build production TypeScript output
npm run build

# Run integration test suite
npm run test
```
