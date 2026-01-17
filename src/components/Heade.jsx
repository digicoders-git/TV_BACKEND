// Heade.jsx
import React, { useEffect, useRef } from "react";
import { logout } from "../redux/features/authSlice.jsx";
import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { LogOut, Menu, Moon, MoreHorizontal, Search, Sun, SunIcon, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

function Heade({ setIsOpen, IsOpen }) {
  const Dispatch = useDispatch();
  const navigate = useNavigate();

  // Theme context से isDark और setIsDark को get करें

   const { theme, toggleTheme } = useTheme(); 
  const VITE_BG_URI = import.meta.env.VITE_BG_URI;
  const profileref = useRef(null);
  const user = useSelector((state) => state.auth.user.user);
  // console.log(user);

  useEffect(() => {
    if (!user) {
      setTimeout(() => {
        Dispatch(logout());
        navigate("/");
      }, 1000);
    }
  }, [user]);

  const handalLogout = () => {
    Dispatch(logout());
    navigate("/");
  };

  return (
    <div className="bg-white dark:bg-[#212529] transition-colors duration-300 py-3 ">
      <div className="flex md:justify-end justify-between items-center border-b md:px-8 px-4 border-slate-800 dark:border-slate-700 py-2 transition-colors duration-300">
        {/* Mobile view */}
        <div className="md:hidden flex items-center">
          <button
            className="text-2xl font-bold text-orange-400 mr-4 hover:text-orange-500 transition-colors duration-300"
            onClick={() => setIsOpen({ ...IsOpen, menu: !IsOpen.menu })}
            aria-label="Toggle menu"
          >
            <Menu size={24} color="black" />
          </button>
          <div>
            {/* <img
              src="/img/bookmyspace.jpeg"
              alt="Logo"
              className="h-10 transition-opacity duration-300 hover:opacity-80"
            /> */}
          </div>
        </div>

        <div className="md:hidden relative">
          <button
            className="flex items-center text-2xl font-bold text-orange-400 hover:text-orange-500 transition-colors duration-300"
            onClick={() => setIsOpen({ ...IsOpen, dots: !IsOpen.dots })}
            aria-label="Toggle menu"
          >
            {IsOpen?.dots ? (
              <span>✕</span>
            ) : (
              <MoreHorizontal size={20} className="text-gray-600" />
            )}
          </button>
          <div
            className={`px-2 py-2 absolute top-14 right-0 dark:bg-slate-900 bg-white shadow-lg rounded-lg w-48 z-50 transition-all duration-300 ${
              IsOpen?.dots
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <button
              onClick={() => {
                setIsOpen({ ...IsOpen, dots: false });
                navigate("/dashboard");
              }}
              className="w-full text-left text-gray-500 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-slate-700 rounded px-3 py-2 transition-colors duration-300 flex items-center text-sm"
            >
              <User size={20} color="gray" className="mr-2" /> Dashboard
            </button>
            <button
              onClick={toggleTheme}
              className="w-full text-left text-gray-500 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-slate-700 rounded px-3 py-2 transition-colors duration-300 flex items-center text-sm"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <>
                  <i className="ri-sun-line mr-2"></i> Light Mode
                </>
              ) : (
                <>
                  <i className="ri-moon-line mr-2"></i>Dark Mode
                </>
              )}
            </button>
            <hr className="dark:border-slate-700 my-1" />
            <button
              onClick={handalLogout}
              className="w-full text-left text-red-500 hover:bg-orange-100 dark:hover:bg-slate-700 rounded px-3 py-2 text-lg transition-colors duration-300 flex items-center text-sm"
            >
              <LogOut size={20} color="gray" className="mr-2" />
              Log out
            </button>
          </div>
        </div>

        {/* Desktop view */}
        <div className="hidden md:flex items-center gap-4">
          {/* <button className="flex justify-center items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 cursor-pointer transition-colors duration-300">
            <Search size={20} className="text-gray-600" />
          </button> */}

          <button
            onClick={toggleTheme}
            className="px-2 py-1 text-lg rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors items-center"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <SunIcon className="text-gray-600" size={20} />
            ) : (
              <Moon className="text-gray-600" size={20} />
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => setIsOpen({ ...IsOpen, dots: !IsOpen.dots })}
              ref={profileref}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-300"
            >
              <div className="relative">
                {/* <img
                  src={`/img/bookmyspace.jpeg`}
                  className="w-10 h-10 rounded-full object-cover"
                  alt="Profile"
                /> */}
                <span className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-1 z-40 border border-white dark:border-slate-900"></span>
              </div>
            </button>

            <div
              className={`w-64 px-2 py-2 absolute top-12 right-0 z-50 mt-2 bg-white dark:bg-slate-900 shadow-lg rounded-lg transition-all duration-300 ${
                IsOpen?.dots
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="flex p-3 border-b border-slate-300 dark:border-slate-700">
                {/* <img
                  src={`/img/bookmyspace.jpeg`}
                  className="h-10 w-10 rounded-full object-cover"
                  alt="Profile"
                /> */}
                <div className="ml-3 text-base font-inter overflow-hidden">
                  <h6 className="font-medium truncate text-gray-900 dark:text-white">
                    {user?.name}
                  </h6>
                  <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* <button
                onClick={() => {
                  setIsOpen({ ...IsOpen, dots: false });
                  navigate("/profile");
                }}
                className="w-full text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg px-3 py-2 mt-1 transition-colors duration-300 flex items-center text-gray-900 dark:text-white"
              >
                <i className="ri-user-line text-xl w-6"></i>
                <span className="ml-2">Profile</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen({ ...IsOpen, dots: false });
                  navigate("/setting");
                }}
                className="w-full text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors duration-300 flex items-center text-gray-900 dark:text-white"
              >
                <i className="ri-settings-4-line text-xl w-6"></i>
                <span className="ml-2">Setting</span>
              </button> */}
              {/* <button
                onClick={() => {
                  setIsOpen({ ...IsOpen, dots: false });
                  navigate("/HelpSection");
                }}
                className="w-full text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors duration-300 flex items-center text-gray-900 dark:text-white"
              >
                <i className="ri-question-answer-line text-xl w-6"></i>
                <span className="ml-2">FAQ</span>
              </button> */}

              <button
                onClick={handalLogout}
                className="w-full cursor-pointer text-white bg-red-500/70 dark:bg-red-600 hover:bg-red-500/90 mt-2 text-sm rounded-lg px-3 py-2 font-semibold transition-colors duration-300 flex items-center justify-center"
              >
                <LogOut size={20} color="gray" className="mr-2" /> Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Heade;
