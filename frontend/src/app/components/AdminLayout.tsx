import { Outlet } from 'react-router';
import { Footer } from './Footer';
import {AdminNavigation} from "./AdminNavigation.tsx";

export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
