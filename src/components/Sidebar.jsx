import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut, Menu, X, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { logout } from "../redux/features/authSlice";

const paletteOptions = [
  { key: 'professional', label: 'Professional' },
  { key: 'modern', label: 'Modern' },
  { key: 'tech', label: 'Tech' },
  { key: 'elegant', label: 'Elegant' },
  { key: 'warm', label: 'Warm' },
];

const Sidebar = ({ isOpen, setIsOpen, routes }) => {
  const location = useLocation();
  const path = location.pathname;
  const user = useSelector((state) => state.auth.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (index) => {
    setExpandedMenus({
      ...expandedMenus,
      [index]: !expandedMenus[index]
    });
  };

  const isActiveRoute = (routePath) => {
    return path === routePath || path.startsWith(routePath + "/");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const { themeColors, palette, changePalette } = useTheme();
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  return (
    <>
      {/* Persistent Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', zIndex: 50, top: 16, left: 16, padding: 8, borderRadius: '50%', background: themeColors.surface, boxShadow: `0 2px 8px ${themeColors.primary}10`, transition: 'all 0.3s', transform: isOpen ? 'translateX(-50px)' : 'translateX(0)', color: themeColors.text,
        }}
      >
        {isOpen ? (
          <ChevronLeft style={{ color: themeColors.text }} size={24} />
        ) : (
          <Menu style={{ color: themeColors.text }} size={24} />
        )}
      </button>

      {/* Sidebar */}
      <div
        style={{
          height: '100%', width: 288, position: 'fixed', left: isOpen ? 0 : -288, background: themeColors.background, zIndex: 45, fontFamily: 'Inter, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s',
        }}
      >
        {/* Close Button (top-right) */}
        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute', top: 16, right: 16, padding: 6, borderRadius: '50%', background: themeColors.surface, color: themeColors.text, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}10`, zIndex: 100,
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            aria-label="Close sidebar"
          >
            <X size={20} style={{ color: themeColors.text }} />
          </button>
        )}
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${themeColors.border}`, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/img/bookmyspace.jpeg" alt="Logo" style={{ height: 40, borderRadius: '50%' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: themeColors.text }}>Admin Panel</h2>
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {routes?.map((route, index) => (
            <div key={index} style={{ position: 'relative' }}>
              {route.collapse ? (
                <>
                  <div
                    onClick={() => toggleMenu(index)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', gap: 12, cursor: 'pointer', borderRadius: 10, margin: '4px 0', transition: 'all 0.3s',
                      background: isActiveRoute(route.path) ? themeColors.active.background : 'none',
                      color: isActiveRoute(route.path) ? themeColors.active.text : themeColors.text,
                    }}
                    onMouseEnter={e => {
                      if (!isActiveRoute(route.path)) {
                        e.currentTarget.style.background = themeColors.hover.background;
                        e.currentTarget.style.color = themeColors.hover.text;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActiveRoute(route.path)) {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = themeColors.text;
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 18, color: isActiveRoute(route.path) ? themeColors.active.text : themeColors.text }}>
                        <i className={route.icon}></i>
                      </div>
                      <div style={{ whiteSpace: 'nowrap' }}>{route.name}</div>
                    </div>
                    <div style={{ transition: 'transform 0.3s', transform: expandedMenus[index] ? 'rotate(90deg)' : 'none', color: isActiveRoute(route.path) ? themeColors.active.text : themeColors.text }}>
                      <i className="ri-arrow-right-s-line"></i>
                    </div>
                  </div>
                  <div
                    style={{
                      overflow: 'hidden', transition: 'all 0.3s', maxHeight: expandedMenus[index] ? 384 : 0, opacity: expandedMenus[index] ? 1 : 0,
                    }}
                  >
                    {route.collapse.map((subRoute, subIndex) => (
                      <Link
                        key={subIndex}
                        to={subRoute.path}
                        onClick={() => setIsOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 12, cursor: 'pointer', borderRadius: 10, margin: '4px 0 4px 24px', transition: 'all 0.3s', background: path === subRoute.path ? themeColors.active.background : 'none', color: path === subRoute.path ? themeColors.active.text : themeColors.text,
                        }}
                        onMouseEnter={e => {
                          if (!(path === subRoute.path)) {
                            e.currentTarget.style.background = themeColors.hover.background;
                            e.currentTarget.style.color = themeColors.hover.text;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!(path === subRoute.path)) {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = themeColors.text;
                          }
                        }}
                      >
                        <div style={{ fontSize: 18, color: path === subRoute.path ? themeColors.active.text : themeColors.text }}>
                          <i className={subRoute.icon}></i>
                        </div>
                        <div style={{ whiteSpace: 'nowrap' }}>{subRoute.name}</div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={route.path}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', padding: '10px 12px', gap: 12, cursor: 'pointer', borderRadius: 10, margin: '4px 0', transition: 'all 0.3s', background: path === route.path ? themeColors.active.background : 'none', color: path === route.path ? themeColors.active.text : themeColors.text,
                  }}
                  onMouseEnter={e => {
                    if (!(path === route.path)) {
                      e.currentTarget.style.background = themeColors.hover.background;
                      e.currentTarget.style.color = themeColors.hover.text;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!(path === route.path)) {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = themeColors.text;
                    }
                  }}
                >
                  <div style={{ fontSize: 18, color: path === route.path ? themeColors.active.text : themeColors.text }}>
                    <i className={route.icon}></i>
                  </div>
                  <div style={{ whiteSpace: 'nowrap' }}>{route.name}</div>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Fixed Bottom Section */}
        <div style={{ borderTop: `1px solid ${themeColors.border}`, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={user?.profilePicture || "/img/bookmyspace.jpeg"}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  alt="Profile"
                />
                <span style={{ width: 8, height: 8, background: themeColors.success, borderRadius: '50%', position: 'absolute', bottom: 0, right: 0, border: `2px solid ${themeColors.surface}` }}></span>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontWeight: 500, color: themeColors.text, fontSize: 14, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name || "User"}
                </h4>
                <p style={{ fontSize: 12, color: themeColors.text, opacity: 0.7, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>
            {/* Settings button for palette switcher */}
            <button
              onClick={() => setShowPaletteModal(true)}
              style={{ background: themeColors.surface, color: themeColors.primary, border: `1px solid ${themeColors.border}`, borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Change color palette"
            >
              <Settings size={18} />
            </button>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: themeColors.danger,
              color: themeColors.surface,
              padding: '12px 20px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              boxShadow: `0 2px 8px ${themeColors.danger}22`,
              cursor: 'pointer',
              transition: 'background 0.2s, box-shadow 0.2s, color 0.2s',
              marginTop: 8,
              letterSpacing: 0.5,
            }}

          
            onMouseEnter={e => {
              e.currentTarget.style.background = themeColors.primary;
              e.currentTarget.style.color = themeColors.surface;
              e.currentTarget.style.boxShadow = `0 4px 16px ${themeColors.primary}22`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = themeColors.danger;
              e.currentTarget.style.color = themeColors.surface;
              e.currentTarget.style.boxShadow = `0 2px 8px ${themeColors.danger}22`;
            }}
          >
            <LogOut size={20} style={{ color: "inherit" }} />
            <span>Logout</span>
          </button>

        </div>
        {/* Palette Modal */}
        {showPaletteModal && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, padding: 24, minWidth: 280 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: themeColors.primary, marginBottom: 16 }}>Choose Color Palette</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {paletteOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { changePalette(opt.key); setShowPaletteModal(false); }}
                    style={{
                      padding: '10px 16px', borderRadius: 8, border: `2px solid ${palette === opt.key ? themeColors.primary : themeColors.border}`,
                      background: palette === opt.key ? themeColors.primary : themeColors.surface,
                      color: palette === opt.key ? themeColors.surface : themeColors.text,
                      fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPaletteModal(false)}
                style={{ marginTop: 20, padding: '8px 16px', borderRadius: 8, background: themeColors.surface, color: themeColors.text, border: `1px solid ${themeColors.border}`, cursor: 'pointer', fontWeight: 500 }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;