# Marketplace Backend — Agent Notes

Last updated: 2026-05-09

This document is the single-source agent-facing summary of the backend: goals, constraints, architecture, data models, APIs, operational notes, and short-term priorities. Keep this file updated as decisions change.

**Agent maintenance note:** THIS FILE IS THE AGENT-FACING SOURCE OF TRUTH for architecture-, API-, or configuration-affecting changes. Agents and humans should document any change that meaningfully affects other collaborators, the API contract, the data model, or deployment configuration by adding:
- a concise changelog entry,
- relevant updates to the API surface and data model sections, and
- an updated `Last updated` date.

Record these updates before merging when possible, or immediately after merging when necessary. Trivial edits that do not alter behavior, contracts, or deployment (formatting, small local refactors, or comments) do not always require a changelog entry — when in doubt, document it. Aim for clarity: a single-line summary plus one bullet describing the impact is sufficient.

**Project**: Marketplace (University) — backend
**Purpose**: Provide a maintainable, testable Node.js + Express API that supports product listing, buying, messaging, reviews, and admin moderation for an institutional marketplace.

----

## 1. Quick facts
- Language / runtime: Node.js (Express)
- Repo entry: [app.js](app.js#L1)
- DB: MongoDB (chosen)
- Auth: JWT (access + refresh tokens)
- Realtime: Socket.io (WebSocket with fallback to polling)
- Image storage: Local for MVP, migrate to S3 for production

----

## 2. Goals & constraints
- Primary goals: security (institutional registration), simple UX for students, reliable order/review lifecycle, in-app communication.
- MVP scope: auth, product CRUD, order creation, reviews, conversations/messages, notifications, admin moderation endpoints.
- Non-goals (MVP): payments integration, advanced recommendation engine, full analytics stack.

----

## 3. Folder & file map (important locations)
- [app.js](app.js#L1) — main Express app
- [bin/www](bin/www#L1) — server start
- [dbManager.js](dbManager.js#L1) — DB connection helpers
- [routes/](routes/README.md) — resource routes (see files inside `routes/`)
- [auth/](auth/) — auth handlers (`login.js`, `register.js`)
- [middleware/](middleware/) — auth & validation middleware
- [public/](public/) — static assets and local image uploads

----

## 4. Environment variables (required / recommended)
- `PORT` — server port (default 3000)
- `NODE_ENV` — development|production
- `DATABASE_URL` — Postgres connection string (or Mongo URI)
- `JWT_SECRET` — access token signing secret
- `JWT_REFRESH_SECRET` — refresh token signing secret
- `IMAGE_UPLOAD_PATH` — local path for uploaded images
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — optional email

----

## 5. Data model (concise)
- User: id, email, name, password_hash, roles (buyer|seller|admin), avatar_url, created_at
- Product: id, seller_id, title, description, price_cents, currency, category, images[], condition, status, created_at
- Order: id, buyer_id, total_cents, status (pending/confirmed/shipped/delivered), created_at
- OrderItem: id, order_id, product_id, qty, unit_price_cents
- Review: id, product_id, reviewer_id, rating, comment, created_at
- Conversation: id, product_id, participants[], last_message_at
- Message: id, conversation_id, sender_id, body, created_at
 - Notification: id, userID, type, title, message, topicID, read, createdAt

Use MongoDB ObjectId (or UUIDs) consistently. Add indexes on `products(title)`, `products(category)`, `products(seller_id)`, and `conversations(last_message_at)`.

----

## 6. API surface (summary)
All endpoints return JSON; protect with auth middleware where noted.

- Auth
  - POST /auth/register — register (institutional email check)
  - POST /auth/login — login (returns access + refresh tokens)
  - POST /auth/refresh — refresh access token
  - POST /auth/logout — revoke refresh token

- Users
  - GET /users/:id — public profile
  - PUT /users/:id — update profile (auth)
  - POST /users/:UID/report — report a user (authenticated users)

- Products
  - GET /products — list + filters + pagination
  - GET /products/:id — detail
  - POST /products — create (seller)
  - PUT /products/:id — update (owner/admin)
  - DELETE /products/:id — delete (owner/admin)
  - GET /products/search?q=... — text search
  - POST /products/:productID/report — report a product (authenticated users)

- Orders
  - POST /orders — create order (simulate payment)
  - GET /orders/:id — detail (buyer/seller)
  - GET /orders — user's orders
  - PATCH /orders/:id/status — update status (seller/admin)

- Reviews
  - POST /products/:id/reviews — create (validate purchase)
  - GET /products/:id/reviews — list

- Conversations / Messages
  - GET /conversations — user's conversations
  - POST /conversations — open conversation
  - GET /conversations/:id/messages — fetch messages
  - POST /conversations/:id/messages — send message

 - Notifications
  - GET /api/notifications — list (authenticated users only; paginated)
    - Query params: `since=<ISO date>` (optional), `page=<number>` (optional, default 1)
    - Behavior: returns only the authenticated user's notifications; supports pagination and optional `since` filtering (returns notifications with `createdAt >= since`). Results are sorted by `createdAt` descending.
      - Responses: `200` with paginated results; `204 { "No notifications" }` if the user has no notifications at all; `204 { "No new notifications" }` when `since` is provided but no newer notifications exist; `400` for invalid `since` or out-of-range page; `404` if the user UID does not exist.

    - Notes: Notifications are generated by the backend on key events (examples implemented):
      - `purchase` — created when a buyer completes checkout (seller notified).
      - `review` — created when a buyer leaves a review (seller notified).
      - `orderUpdate` — created when a seller updates an order's status (buyer notified).
    - Middleware: this endpoint is protected by `tokenValidator` and `userValidator` middleware.
  - PATCH /api/notifications/readAll — mark all user's notifications as read (authenticated users only)
  - PATCH /api/notifications/:notificationID — update notification state (authenticated users only)
    - Request body: `{ "read": <true|false> }`
    - Behavior: verifies that the notification exists and belongs to the authenticated user, validates that `read` is boolean, then updates the notification's `read` field.
    - Responses: `200 { "Notification state updated" }` on success, `404 { "Notification not found" }` if missing, `403 { "You are not allowed to do this" }` if user mismatch, `400` for invalid payload.

  - PATCH /api/notifications/readAll — mark all notifications as read (authenticated users only)
    - Behavior: verifies the authenticated user exists, then updates all notifications with `userID` equal to the user to set `read: true`.
    - Responses: `200 { "Notifications marked as read" }` on success; `404 { "No notifications" }` if the user has no notifications; `400` for invalid JWT; `500` on server error.

    - GET /api/notifications/unreadCount — return the count of unread notifications for the authenticated user
      - Behavior: Authenticated-only endpoint that counts notifications where `userID` matches the authenticated user's UID and `read` is `false`.
      - Responses: `200 { count: <number> }` on success (count may be 0), `404 { "User not found" }` if the user does not exist, `400` for invalid JWT, `500` on server error.

- Admin
  - POST /api/admin/dashboard — site activity summary (admin-only)
  - DELETE /api/admin/products/:productID — soft-delete product (admin-only)
  - PATCH /api/admin/users/:UID/suspend — suspend a user and soft-delete their products (admin-only)
  - GET /api/admin/reports/:reportID — fetch a specific report (admin-only)
  - GET /api/admin/reports?page=X — list active reports, paginated (admin-only)
  - GET /admin/stats — metrics (future)
   - GET /api/admin/products — list products (admin view; includes soft-deleted items)
   - GET /api/admin/users — list users (admin view; includes suspended users)
   - GET /admin/stats — metrics (future)
   - PATCH /api/admin/reports/:reportID/resolve — resolve a report and optionally perform corrective action (admin-only)

----

## 7. Auth & security recommendations
- JWT short-lived access tokens (eg. 15m) + refresh tokens stored hashed server-side.
- Validate institutional email domain(s) during registration (decide canonical domain).
- Hash passwords with bcrypt (salted). Rate-limit auth endpoints. Validate inputs with `Joi` or `express-validator`.
- Sanitize and validate file uploads (type, size). Use signed URLs for S3 in prod.

----

## 8. Realtime & notifications
- Socket.io rooms: `user:<id>` and `conversation:<id>`. Emit `new_message`, `order_updated`, `new_review` events.
- Provide REST fallbacks (polling) for environments without WebSocket support.

----

## 9. Storage & backups
- Images: local `public/images/` during development. Plan migration to S3 with environment config.
- DB backups: schedule daily backups for production DB. Use managed DB snapshots where possible.

----

## 10. Development & testing
- Install: `npm install`
- Run dev: `npm run dev` or `node ./bin/www`
- Lint: add `eslint` and `prettier`; consider `husky` + `lint-staged` hooks.
- Tests: unit tests (Jest/Mocha) + integration tests (Supertest) for auth, products, orders.

----

## 11. Deployment notes
- Containerize with Docker; keep app stateless. Use `DATABASE_URL` and secrets from environment.
 - In production use HTTPS and rotate JWT secrets periodically. Use a managed MongoDB service + S3.

----

## 12. Short-term roadmap (next tasks)
1. DB choice confirmed (MongoDB). Add migration/tooling for MongoDB (e.g., `migrate-mongo` or custom migration scripts).
2. Implement orders + review constraints (only buyers who purchased can review).
3. Notifications: GET endpoint and service implemented; next: mark-read endpoint and Socket.io integration.

----

## 13. Changelog (recent changes)
 - 2026-05-07: Implemented `POST /api/admin/dashboard` endpoint (admin-only). See `routes/admin/dashboard.js`.
 - 2026-05-07: Added `DbManager` helpers: `countUsers()`, `countActiveSellers()`, `countProducts()`, `countOrders()` in `dbManager.js`.
 - 2026-05-07: Registered `/api/admin/dashboard` in `app.js` and protected it with `tokenValidator` + `adminValidator` middleware.
 - 2026-05-07: Implemented `DELETE /api/admin/products/:productID` to soft-delete products; added `findProductRawByID()` helper and mounted admin products router under `/api/admin/products`.
 - 2026-05-07: Implemented `PATCH /api/admin/users/:UID/suspend` to suspend users, store suspension reason, and soft-delete their products. Added `suspendUser()` helper in `dbManager.js`.
 - 2026-05-07: Implemented `POST /api/products/:productID/report` to allow authenticated users to report products. Added `reports` collection helpers in `dbManager.js` and mounted `routes/products/report.js`.
 - 2026-05-07: Implemented `POST /api/users/:UID/report` to allow authenticated users to report users. Added `routes/users/report.js` and mounted it in `routes/users/user.js`. Reused `reports` collection helpers in `dbManager.js`.
 - 2026-05-07: Implemented `GET /api/admin/reports/:reportID` to allow admins to fetch a report. Added `routes/admin/reports.js`, mounted under `/api/admin/reports`, and added `dbManager.findReportByID()` helper.
 - 2026-05-09: Implemented notifications subsystem:
   - Added `GET /api/notifications` (authenticated, paginated) and mounted it in `app.js`.
   - Added `dbManager.findNotificationsByUser()` to fetch notifications with pagination.
   - Added `dbManager.addNotification()` as the raw DB insert helper for notifications.
   - Added `services/notifications.js` with `createNotification()` to validate/default notification documents before inserting.
   - Updated review creation handler (`routes/products/reviews/create.js`) to generate a `review` notification for the product seller after a successful review creation.
   - Updated seller shipping status update handler (`routes/seller/shipping/update.js`) to create `orderUpdate` notifications for buyers when order status changes.
   - Checkout flow (`routes/sales/checkout.js`) already creates `purchase` notifications for sellers when orders are placed.

 - 2026-05-09: Enhanced `GET /api/notifications` endpoint:
   - Accepts optional `since` query parameter to filter notifications with `createdAt >= since`.
   - Returns `204 { "No notifications" }` when the user has none, and `204 { "No new notifications" }` when `since` yields no results.
   - Validates `since` as a date and returns `400` on invalid input; supports pagination and preserves sort by `createdAt` descending.
   - Updated `dbManager.findNotificationsByUser(UID, page, limit, since)` to accept the `since` filter.

 - 2026-05-09: Refactored notifications routes and updated frontend integration:
   - Split the notifications router into `routes/notifications/get.js`, `routes/notifications/updateReadStatus.js`, `routes/notifications/readAll.js`, and `routes/notifications/unreadCount.js`, and composed them in `routes/notifications/notification.js` which is mounted in `app.js`.
   - Standardized `204` responses to include a `message` field (`"No notifications"` / `"No new notifications"`).
   - Added `dbManager.findNotificationByID()` and `dbManager.updateNotification()` helpers (used by the PATCH handler).
   - Implemented `PATCH /api/notifications/readAll` to allow users to mark all their notifications as read. Added `dbManager.markAllNotificationsRead()` helper and `routes/notifications/readAll.js`; mounted in `routes/notifications/notification.js`.
   - Implemented `GET /api/notifications/unreadCount` and added `dbManager.countUnreadNotifications()` to provide an authenticated unread-count-only endpoint for clients needing lightweight polling.
 - 2026-05-09: Implemented resolve flow for reports (admin-only):
   - Added `PATCH /api/admin/reports/:reportID/resolve` to allow admins to resolve reports and optionally take corrective action.
   - Added `dbManager.updateReport()` helper and wired report-resolution metadata (fields: `resolved`, `deleted`, `resolutionReason`, `actionTaken`, `resolvedAt`, `resolvedBy`).
   - `deleteOffending` now performs the appropriate corrective action based on report `type`: for `userReport` it suspends the reported user and soft-deletes their products; for `productReport` it soft-deletes the offending product.
 - 2026-05-09: Admin listing endpoints and DB helpers:
   - Added `GET /api/admin/products` to return paginated products for admin views; this endpoint includes soft-deleted products and supports filters similar to the public product search.
   - Added `GET /api/admin/users` to return paginated users for admin views; this endpoint includes suspended users and supports basic search by `name` or `email` and an `isSeller` filter.
   - Added `dbManager.findProductsAdmin()` and `dbManager.findUsers()` helpers to support paginated admin listings.
   - Updated `routes/admin/users.js` to accept flexible boolean formats for the `isSeller` query parameter (`true|false`, `1|0`, `yes|no`). Invalid values return `400`.
----

## 14. Decisions to make / Questions
- DB: MongoDB selected (decision already made).
- Institutional email domain(s) to enforce at register?
- Image storage: keep local or provide S3 credentials now?

----

If you want, I can:
- scaffold route handlers and services,
- produce a minimal DB schema + migration file,
- or generate an OpenAPI spec for the routes above.

Keep this file current; reference it when making architectural decisions.
