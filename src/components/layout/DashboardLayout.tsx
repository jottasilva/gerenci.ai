import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
