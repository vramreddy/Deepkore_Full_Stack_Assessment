import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

function AdminLayout() {
  return (
    <div className="admin-app-container">
      <AdminNavbar />
      <div className="admin-body-container">
        <AdminSidebar />
        <main className="admin-main-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
