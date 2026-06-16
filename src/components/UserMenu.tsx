import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name ?? user?.userId ?? 'Admin';

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="user-menu-wrap" ref={menuRef}>
      <div className="user-menu">
        <img src="/user_icon.png" alt="" className="user-avatar" />
        <div className="user-info">
          <span className="user-name">{displayName}</span>
          <span className="user-role">Admin</span>
        </div>
        <button
          type="button"
          className={`user-chevron-btn ${open ? 'open' : ''}`}
          aria-label="User menu"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((prev) => !prev)}
        >
          <svg
            className="user-chevron-icon"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-header">
            <img src="/user_icon.png" alt="" className="user-dropdown-avatar" />
            <div>
              <span className="user-dropdown-name">{displayName}</span>
              <span className="user-dropdown-role">Admin</span>
            </div>
          </div>
          <div className="user-dropdown-divider" />
          <button type="button" className="user-dropdown-item" role="menuitem" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
