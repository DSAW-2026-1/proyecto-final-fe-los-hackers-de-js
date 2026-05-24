NOTE: Pretty sure this file is stale.

# Unisabana Marketplace - Implementation Roadmap

**Date:** 2026-05-12
**Language:** Spanish (Colombia)
**Context:** Institutional marketplace for Universidad de La Sabana.

## 🚀 Current State: Functional Integration & Refinement
The project has successfully transitioned from prototypes to a functional application. Core flows (Auth, Search, Cart, Profile) are now integrated with a real service layer and routing.

### 🎯 Primary Goal
Finalize the institutional commerce experience by hardening the moderation flows, improving mobile UX, and ensures consistency between the frontend and the transactional API responses.

### 🎨 Branding & Design Foundations
- **Official Logos:** Centralized in `/res/images/` (Logo Blue, Logo White, Logo with Text).
- **Institutional Context:**
  - **Career Mapping:** "Ingeniería Informática" and other Sabana-specific identifiers.
  - **Administrative Tone:** "Rechazar" for moderation; "Campus Safety Tips" branding.
- **UI System:**
  - **Framework:** React 18 + Vite + Tailwind CSS.
  - **Library:** **shadcn/ui** (based on Radix UI).
  - **Motion:** `motion/react` for smooth state transitions and route changes.
- **Mobile First:** Specific responsive layouts for Shopping Cart (stacking items) and Product Search (Sheet-based filters).

## 📁 Core Application Structure (Functional)
- **Navigation:** Adaptive header with guest/profile dropdowns based on auth state.
- **Identity:** `UserProfile.tsx` now fetches real reviews, resolving buyer profile data and product context dynamically.
- **Commerce:** 
  - `ProductSearch.tsx`: Advanced filter drawer for mobile.
  - `ProductDetail.tsx`: Seller card linking to profile.
  - `ShoppingCart.tsx`: Fully responsive list with quantity management.
- **Inventory:** `SellerDashboard.tsx` uses real metrics (Active Orders) from API integration.

## 🛠️ Technical Baseline
- **Build Command:** `npm run dev` (Port 3000).
- **Service Layer:** `api.ts` (Fetch wrapper) + specific services (`userService.ts`, `productService.ts`).
- **Data Safety:** Handling of edge cases like deleted products in reviews or missing seller photos.
- **Linting:** Strict `eslint` compliance for clean hooks and dependency management.

## 📍 Next Priorities
1. **Moderation Flow:** Finalize the `AdminDashboard.tsx` and report handling as per TRD.
2. **Real-time Comms:** Implement the chat interface signaling logic.
3. **Checkout Finalization:** Connect the cart to a transactional state for order creation.
4. **Institutional Security:** Verify institutional email validation logic in the registration flow.

## 🚧 Status Checklist
- [x] High-fidelity UI Prototypes (V1 Complete)
- [x] Dynamic Routing & Navigation Logic
- [x] Service Layer Integration (User Profile, Reviews, Products)
- [x] Mobile Responsiveness Audit (Cart, Search)
- [ ] Final Moderation & Accessibility Audit

---

## 🛰️ Frontend state (2026-05-20)

Summary of recent chat/messaging work:

- Chat UI consolidated under /chat (ChatInterface). Conversations load in-place; selection no longer navigates away to a separate route.
- Navigation now uses /chat?open=<chatId> to open a conversation. Legacy /messages/:chatId route remains but is deprecated.
- Components changed: StartConversationModal, ContactSellerModal, ConversationsList, ChatInterface, MessagesView, useConversationSocket, socketService.
- WebSocket client defaults to VITE_WS_URL (if unset defaults to http://localhost:3000 in dev). Payloads standardized to use chatId.
- Transparent polling fallback implemented: when WS disconnects, useConversationSocket polls /api/chat/:chatId/messages/polling every 5s; logs lifecycle to console and stops polling when WS reconnects.
- Frontend apiRequest adds Authorization: Bearer <token> from localStorage 'token' for authenticated requests; ensure tokens are present in localStorage during manual testing.

Dev notes & how to run
- Start backend first (ensure MONGODB_URI + JWT_SECRET are configured, backend default port 3000).
- Frontend: npm install (once), set .env (optional) VITE_API_BASE_URL, VITE_API_PORT, VITE_WS_URL, then npm run dev.
- To test messaging flows: open two browser tabs with different tokens and verify WS messages; simulate WS down to verify polling fallback.

Cleanup suggestions
- Remove MessagesRoute (/messages) after migrating any remaining callers.
- Add E2E test coverage for WS fallback and chat open-from-product flows.

Contact
- Changes applied during Copilot session on 2026-05-20.

IMPORTANT: Subagent / Automated Test URL Policy

- Subagents and automated test agents MUST NOT target deployed production or public URLs. Use local development endpoints (http://localhost:3000, http://localhost:5173) or an explicitly provided staging/test URL.
- Any agent contacting a non-local endpoint must have explicit human approval and the exact URL provided in the instructions. This prevents accidental interference with live systems and data leakage.
