# Unisabana Marketplace - Implementation Roadmap

**Date:** 2026-04-25
**Language:** Spanish (Colombia)
**Context:** Institutional marketplace for Universidad de La Sabana.

## 🚀 Current State: Transition to Functional Frontend
The project is pivoting from a high-fidelity UI prototype to a structured, functional frontend. All major view components exist as prototypes and are now being integrated into a cohesive application flow that adheres to the `TRD.txt` requirements.

### 🎯 Primary Goal
Convert existing design primitives and mockups into a production-ready institutional marketplace. This involves implementing robust routing, state management, and preparation for backend integration (API/Firebase), ensuring every functional requirement of the TRD is met.

### 🎨 Branding & Design Foundations
- **Official Logos:** Centralized in `/res/images/`:
  - `unisabana_logo_blue.png` (Main Navigation)
  - `unisabana_logo_white.png` (Institutional Footer)
  - `unisabana_logo_with_text_blue.png` (Auth Flow)
- **Institutional Context:**
  - **Career Mapping:** "Ingeniería Informática" is the exclusive identifier for IT-related students.
  - **Administrative Tone:** Using "Rechazar" for moderation and institutional safety terminology.
  - **Localization:** COP pricing via `toLocaleString('es-CO')`.
- **UI System:**
  - **Framework:** React 18 + Vite + Tailwind CSS.
  - **Library:** **shadcn/ui** (based on Radix UI).
  - **Motion:** `motion/react` for all meaningful transitions.

## 📁 Core Application Structure (Functional Focus)
- **Core Architecture:** Centralized routing in `App.tsx` (transitioning from flat list to conditional/route-based rendering).
- **Domain Modules:**
  - **Identity:** `Login.tsx`, `Register.tsx`, `UserProfile.tsx`.
  - **Commerce:** `ProductSearch.tsx` (Advanced filtering), `ProductDetail.tsx`, `ShoppingCart.tsx`, `Checkout.tsx`.
  - **Inventory:** `SellerDashboard.tsx`, `CreateProduct.tsx`, `EditProduct.tsx`.
  - **Governance:** `AdminDashboard.tsx`, `AdminReportView.tsx` (Moderation flow).
- **Communication:** `ChatInterface.tsx`, `Notifications.tsx`.

## 🛠️ Technical Baseline
- **Build Command:** `npm run dev` (Port 3000).
- **Style Invariant:** Tailwind-only styling managed via `src/styles/index.css`.
- **Iconography:** Strict use of `lucide-react`.

## 📍 Immediate Priorities (Functional Migration)
1. **Dynamic Routing:** Implement `react-router` to separate the prototypes into logical user paths.
2. **State Management:** Implement a global state (Context/Zustand) for Cart, Auth, and Notifications.
3. **Data Integration:** Replace `MOCK_DATA` constants with a structured service layer (preparing for the REST API/Firestore).
4. **Safety Branding:** Integrate "Campus Safety Tips" into search and product views as per TRD usablity guidelines.

## 🚧 Status Checklist
- [x] High-fidelity UI Prototypes (V1 Complete)
- [ ] Centralized Routing & Navigation Logic (In Progress)
- [ ] Global Store (Cart/Auth)
- [ ] API/Firebase Service Layer
- [ ] Final Accessibility & Performance Audit
