import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-main">
        <div className="page-container">
          <div className="page-card">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
