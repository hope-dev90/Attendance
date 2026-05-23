import logo from "../assets/logo.jpg";
import {
  LayoutDashboard,
  UserCheck,
  History,
  ArrowLeft,
  LogOut,
} from "lucide-react";
const NAVY = "#2e5a88";

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { id: "attendance", label: "Attendance", icon: UserCheck },
  { id: "history",    label: "History",    icon: History },
];

const Sidebar = ({ activePage, onNavigate, onBack, onLogout }) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        .staffnet-sidebar {
          width: 260px; min-height: 100vh; background: #ffffff;
          border-right: 1px solid #e8edf4; display: flex; flex-direction: column;
          font-family: 'DM Sans', sans-serif; position: fixed; left: 0; top: 0; bottom: 0;
          z-index: 100; box-shadow: 2px 0 16px rgba(46,90,136,.06);
        }
        .sidebar-logo {
          display: flex; align-items: center; gap: 12px;
          padding: 28px 24px 24px; border-bottom: 1px solid #f1f5f9;
          margin-bottom: 13px;
        }
        .logo-icon {
          width: 40px; height: 40px; background: #fff; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          overflow: hidden; border: 1px solid #e8edf4;
        }
        .logo-icon img { width: 100%; height: 100%; object-fit: contain; }
        .logo-text h1 { font-size: 18px; font-weight: 900; color: #1e293b; letter-spacing: -0.3px; line-height: 1; }
        .logo-text p  { font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; margin-top: 2px; }
        .sidebar-nav { flex: 1; padding: 20px 14px; display: flex; flex-direction: column; gap: 4px; }
        .nav-item {
          display: flex; align-items: center; gap: 12px; padding: 11px 14px;
          border-radius: 12px; font-size: 14px; font-weight: 700; color: #64748b;
          cursor: pointer; transition: all 0.15s ease; border: none; background: transparent;
          width: 100%; text-align: left;
        }
        .nav-item:hover { background: #f1f5f9; color: #1e293b; }
        .nav-item.active { background: ${NAVY}; color: #ffffff; }
        .nav-item svg { opacity: 0.6; flex-shrink: 0; }
        .nav-item.active svg { opacity: 1; }
        .sidebar-footer { padding: 14px; border-top: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 2px; }
        .footer-btn {
          display: flex; align-items: center; gap: 12px; padding: 11px 14px;
          border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.15s ease; border: none; background: transparent; width: 100%; text-align: left;
        }
        .footer-btn.back   { color: #64748b; }
        .footer-btn.back:hover   { background: #f1f5f9; color: #1e293b; }
        .footer-btn.logout { color: #ef4444; }
        .footer-btn.logout:hover { background: #fff5f5; }
        @media (max-width: 768px) {
          .staffnet-sidebar { transform: translateX(-100%); transition: transform .25s ease; }
          .staffnet-sidebar.open { transform: translateX(0); }
        }
      `}</style>

      <aside className="staffnet-sidebar">
        <div className="sidebar-logo">
         <div className="logo-icon">
  <img src={logo} alt="logo" />
</div>
          <div className="logo-text">
            <h1>StaffNet</h1>
            <p>Attendance Section</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => onNavigate?.(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="footer-btn back" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="footer-btn logout" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
