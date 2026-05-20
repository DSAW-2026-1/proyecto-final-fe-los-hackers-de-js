# Sabana Market - Frontend Prototype

A university marketplace prototype for students of Universidad de La Sabana.

## Tech Stack
- React 18
- Vite
- Tailwind CSS
- shadcn/ui components
- Lucide React icons
- Framer Motion

## Getting Started
To run the development server:
```bash
npm install
npm run dev-local
```
Do NOT use ```npm run dev```, this config is only used by the Google AI studio environment and WILL cause problems locally.

To build for production:
```bash
npm run build
```

## Prototype Scope
This is a frontend-only prototype demonstrating the user interface and main workflows (buying, selling, reporting, profile management). Data is managed using local mock objects.

Manual verification / smoke tests:

- Build: npm --prefix frontend run build
- Start dev server: npm --prefix frontend run dev
- Visit /chat to see the Conversations list and chat UI.
- Click a conversation to open messages at /messages/:chatId.
- To test socket updates locally, run the backend/socket server and send a 'receive_message' event; the conversation preview should update, move to top, and display an unread badge.

If the build fails, mark the task 'frontend-view-chats' as blocked in the todos DB and include the build error output in the report.
