# Production Deployment & Release Guide (`DEPLOYMENT.md`)

This guide outlines the procedure for deploying the **SecuShield Security Management Backend** and building the **SecuShield Mobile Application** for production Android release.

---

## 1. Backend Production Deployment

### Prerequisites & Architecture
- **Runtime Environment**: Node.js v18+ or v20+ LTS
- **Database**: Production MongoDB instance (MongoDB Atlas or self-hosted managed MongoDB)
- **Architecture**: Single-instance RESTful Express API service

### Step-by-Step Deployment Flow

1. **Clone & Install Dependencies**
   ```bash
   cd backend
   npm install --production=false
   ```

2. **Configure Environment Variables**
   Create a `.env` file on the production host or configure environment variables in your cloud provider container/PaaS settings:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster_host>/secushield?retryWrites=true&w=majority
   JWT_SECRET=<STRONG_UNIQUE_64_CHAR_RANDOM_SECRET>
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://app.yourcompany.com
   TRUST_PROXY=true
   RATE_LIMIT_WINDOW_MS=900000
   LOGIN_RATE_LIMIT_MAX=10
   API_RATE_LIMIT_MAX=300
   ALLOW_PRODUCTION_SEED=false
   ```

3. **Build JavaScript Output**
   ```bash
   npm run build
   ```
   *Compiles TypeScript source from `src/` to production JavaScript in `dist/`.*

4. **Start Production Server**
   ```bash
   npm start
   ```
   *Executes `node dist/server.js`.*

5. **Verify Health Endpoint**
   Test the health check endpoint:
   ```bash
   curl -i https://<your-backend-domain>/api/v1/health
   ```
   *Expected HTTP status*: `200 OK` (when database is connected) or `503 Service Unavailable` (if database is degraded).

---

## 2. Mobile Application Production Build (Android)

### Prerequisites
- Installed Expo CLI (`npm install -g eas-cli`)
- Configured Expo / EAS account

### Configuration Verification

1. **Environment Setup**
   Configure your production API URL in `app/.env`:
   ```env
   EXPO_PUBLIC_API_URL=https://<your-backend-domain>/api/v1
   EXPO_PUBLIC_API_BASE_URL=https://<your-backend-domain>/api/v1
   ```

2. **Build Commands**
   
   - **Internal Testing / Preview APK**:
     ```bash
     cd app
     eas build --platform android --profile preview
     ```
     *Generates a standalone `.apk` for direct device installation and testing.*

   - **Production Play Store Bundle (.aab)**:
     ```bash
     cd app
     eas build --platform android --profile production
     ```
     *Generates a signed `.aab` (Android App Bundle) ready for upload to Google Play Console.*

---

## 3. Production Security & Data Safeguards

1. **Environment Protection**: Never commit `.env` files. Ensure `.env` is listed in `.gitignore`.
2. **MongoDB Production Safeguards**:
   * MongoDB URI must require authentication.
   * Enable automated backups (Point-in-time recovery) on your database provider.
   * Restrict database network access (IP Whitelisting or VPC peering).
3. **Database Seeding Guardrail**: Demo seeding (`npm run seed`) is automatically blocked in production unless `ALLOW_PRODUCTION_SEED=true` is explicitly provided. Do **NOT** enable seeding in a production environment.
4. **JWT Security**: Always set a strong, unique `JWT_SECRET` generated using `crypto.randomBytes(32).toString('hex')`.

---

## 4. Post-Deployment Smoke-Test Matrix

### Backend Smoke Tests
- [ ] `GET /api/v1/health` returns `200 OK` with `"database": {"connected": true}`.
- [ ] Database connection initiates cleanly without error logs.
- [ ] `POST /api/v1/auth/login` validates credentials correctly.
- [ ] Invalid passwords return `401 Unauthorized`.
- [ ] Protected routes without token return `401 Unauthorized`.

### Security & RBAC Smoke Tests
- [ ] Accessing another building's resources returns `403 Forbidden` or `404 Not Found`.
- [ ] Guard user requesting salary endpoint receives `200 OK` for own record only.
- [ ] Committee user requesting salary endpoints receives `403 Forbidden`.
- [ ] Exceeding 10 rapid failed login attempts triggers HTTP `429 Too Many Requests`.

### Mobile App Smoke Tests
- [ ] Mobile app launches cleanly on production Android device.
- [ ] Sign-in connects successfully to production API endpoint.
- [ ] Dashboard loads active buildings, guards, and shifts.
- [ ] Attendance check-in and visitor logging operate normally.
- [ ] Expiration or sign-out redirects safely to the login screen.
