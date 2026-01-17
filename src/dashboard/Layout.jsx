import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import adminRoutes from "../route/SidebarRaoute";
import { useSelector } from "react-redux";
import { LogOut, Moon, Sun, User, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/features/authSlice";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { theme, toggleTheme, themeColors } = useTheme();
  const user = useSelector((state) => state.auth.user?.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-menu-container')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: themeColors.background }}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        routes={adminRoutes} 
      />

      {/* Main content area */}
      <div style={{ flex: 1, background: themeColors.surface, minHeight: '100vh' }}>
        {/* Fixed Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 40, background: themeColors.surface, boxShadow: `0 2px 8px ${themeColors.primary}10`, padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeColors.border}`, padding: '12px 16px' }}>
            {/* Left side - Logo and Hamburger menu (mobile) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Mobile menu button */}
              <button 
                style={{ display: 'block', color: themeColors.text, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              {/* Logo and Title */}
              {/* <div className="flex items-center gap-2 ms-20">
                <img 
                  src="/img/bookmyspace.jpeg" 
                  alt="Logo" 
                  className="h-10 w-10 rounded-full object-cover"
                />
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                  Qa Book My Space
                </h1>
              </div> */}
            </div>

            {/* Right side - Dashboard and Profile section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Profile Dropdown */}
              <div className="relative profile-menu-container">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: profileMenuOpen ? 0.8 : 1, transition: 'opacity 0.2s', outline: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label="Profile menu"
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={user?.profilePicture || "/img/bookmyspace.jpeg"}
                      style={{ height: 40, width: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${themeColors.primary}` }}
                      alt="Profile"
                    />
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: themeColors.success, borderRadius: '50%', border: `2px solid ${themeColors.surface}` }}></span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 224, background: themeColors.surface, boxShadow: `0 4px 24px ${themeColors.primary}20`, borderRadius: 10, zIndex: 50, overflow: 'hidden' }}>
                    <div style={{ padding: 16, borderBottom: `1px solid ${themeColors.border}` }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: themeColors.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.name || "User"}
                      </p>
                      <p style={{ fontSize: 13, color: themeColors.text, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                      <button
                        onClick={toggleTheme}
                        style={{ width: '100%', textAlign: 'left', color: themeColors.text, background: themeColors.active.background, border: 'none', borderRadius: 8, padding: '8px 12px', transition: 'background 0.2s', display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 500, marginBottom: 4, cursor: 'pointer' }}
                        aria-label="Toggle dark mode"
                      >
                        {theme === "dark" ? (
                          <>
                            <Sun style={{ marginRight: 8, color: themeColors.text }} /> Light Mode
                          </>
                        ) : (
                          <>
                            <Moon style={{ marginRight: 8, color: themeColors.text }} /> Dark Mode
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleLogout}
                        style={{ width: '100%', textAlign: 'left', color: themeColors.danger, background: themeColors.surface, border: 'none', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                      >
                        <LogOut style={{ marginRight: 8, color: themeColors.danger }} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main style={{ padding: 10 }}>{children}</main>
      </div>
    </div>
  );
}

export default Layout;