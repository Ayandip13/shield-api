# SecuShield Backend API Route Inventory & Security Matrix

## Overview
All endpoints are mounted under the `/api/v1` base route and enforce standardized `ApiResponse.success` / `ApiResponse.error` payloads, `X-Request-ID` tracking, JSON body size limits (100kb), rate limiting, and strict tenant isolation.

---

## 1. Health & Infrastructure
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | System health check (server uptime, database state) |

---

## 2. Authentication (`/api/v1/auth`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public (Rate Limited: 10/15m) | Authenticates credentials, returns short-lived Access Token (`15m`) & Opaque Refresh Token (`30d`) |
| `POST` | `/api/v1/auth/refresh` | Public (Rate Limited: 10/15m) | Validates refresh token, executes rotation, detects reuse attacks, returns new token pair |
| `POST` | `/api/v1/auth/logout` | Public | Revokes specified refresh token session in MongoDB |
| `POST` | `/api/v1/auth/logout-all` | Authenticated | Revokes all active refresh sessions across devices for authenticated user |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns current authenticated user context |

---

## 3. Building Management (`/api/v1/buildings`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/buildings` | `provider_admin` | Lists provider's buildings (supports `page`, `limit`) |
| `POST` | `/api/v1/buildings` | `provider_admin` | Creates building under authenticated provider |
| `GET` | `/api/v1/buildings/:id` | `provider_admin` | Fetches building details by ObjectId |
| `PATCH` | `/api/v1/buildings/:id` | `provider_admin` | Updates building metadata (name, address, contacts) |
| `PATCH` | `/api/v1/buildings/:id/status` | `provider_admin` | Activates/deactivates building |

---

## 4. Guard Management (`/api/v1/guards`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/guards/me` | `guard` | Guard self-service profile and assigned post |
| `GET` | `/api/v1/guards` | `provider_admin` | Lists provider guards (filter: `buildingId`, `page`, `limit`) |
| `POST` | `/api/v1/guards` | `provider_admin` | Creates guard account (forces `role = 'guard'`) |
| `GET` | `/api/v1/guards/:id` | `provider_admin` | Fetches guard details |
| `PATCH` | `/api/v1/guards/:id` | `provider_admin` | Updates guard profile & assigned building |
| `PATCH` | `/api/v1/guards/:id/status` | `provider_admin` | Soft activates/deactivates guard |
| `GET` | `/api/v1/guards/:guardId/shift` | `provider_admin`, `guard` | Fetches guard shift roster |
| `PUT` | `/api/v1/guards/:guardId/shift` | `provider_admin` | Configures guard shift schedule |

---

## 5. Building Committee Management (`/api/v1/committee-members` & `/api/v1/committee`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/committee/me` | `committee` | Committee member self-service profile |
| `GET` | `/api/v1/committee-members` | `provider_admin` | Lists committee members (filter: `buildingId`, `page`, `limit`) |
| `POST` | `/api/v1/committee-members` | `provider_admin` | Creates committee account (forces `role = 'committee'`) |
| `GET` | `/api/v1/committee-members/:id` | `provider_admin` | Fetches committee member details |
| `PATCH` | `/api/v1/committee-members/:id` | `provider_admin` | Updates committee member details |
| `PATCH` | `/api/v1/committee-members/:id/status` | `provider_admin` | Activates/deactivates committee account |

---

## 6. Duty Attendance (`/api/v1/attendance`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/v1/attendance/check-in` | `guard` | Guard shift check-in (atomic open-session check) |
| `POST` | `/api/v1/attendance/check-out` | `guard` | Guard shift check-out (atomic conditional update) |
| `GET` | `/api/v1/attendance/me` | `guard` | Guard duty attendance history |
| `GET` | `/api/v1/attendance/me/today` | `guard` | Guard today's duty state & shift info |
| `GET` | `/api/v1/attendance` | `provider_admin` | Multi-building attendance logs (date range <= 90d) |
| `GET` | `/api/v1/attendance/building` | `committee` | Building attendance logs strictly for committee building |

---

## 7. Visitor & Vehicle Entry Logs (`/api/v1/entry-logs`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/entry-logs/active` | `guard`, `committee`, `provider_admin` | Returns active visitors inside (`exitTime == null`) |
| `GET` | `/api/v1/entry-logs` | `guard`, `committee`, `provider_admin` | Filtered historical entry logs |
| `GET` | `/api/v1/entry-logs/:id` | `guard`, `committee`, `provider_admin` | Single entry log record details |
| `POST` | `/api/v1/entry-logs` | `guard` | Guard logs visitor/vehicle entry |
| `PATCH` | `/api/v1/entry-logs/:id/exit` | `guard` | Guard marks exit (conditional `exitTime: null`) |

---

## 8. Dashboard & Activity Feed (`/api/v1/dashboard`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/dashboard` | `provider_admin`, `committee` | Live security metrics and activity summary |
| `GET` | `/api/v1/dashboard/guard` | `guard` | Guard terminal status summary |
| `GET` | `/api/v1/dashboard/activity` | `provider_admin`, `committee` | Filterable security activity feed |

---

## 9. Account Profile (`/api/v1/profile`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/profile` | Authenticated | User profile derived from JWT |
| `PATCH` | `/api/v1/profile` | Authenticated | Updates personal info (`name`, `phone`) |
| `PATCH` | `/api/v1/profile/password` | Authenticated | Password change with current password verification |

---

## 10. In-App Notifications (`/api/v1/notifications`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Authenticated | Returns paginated notifications scoped to user's tenant/role |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated | Returns unread notification count |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated | Marks all scoped unread notifications as read |
| `PATCH` | `/api/v1/notifications/:id/read` | Authenticated | Marks single notification as read |

