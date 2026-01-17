import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../redux/features/authSlice.jsx";
import { toast } from "react-toastify";
import axios from "axios";
import { useTheme } from "../context/ThemeContext.jsx";


const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const BaseUri = import.meta.env.VITE_BASE_API;

  const { themeColors } = useTheme() || {};
  
  // Fallback colors if themeColors is not available
  const fallbackColors = {
    background: "#f9fafb",
    text: "#101828",
    primary: "#ff990b",
    accent: "#fcc31b",
    hover: {
      background: "#f8eabc",
      text: "#101828"
    }
  };
  
  const colors = themeColors || fallbackColors;

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: ""});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 2) {
      newErrors.password = "Password must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const { data } = await axios.post(`${BaseUri}/api/admin/login`, formData);

      if (data.success) {
        dispatch(login(data));
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.log("login err",error)
      const errRes = error.response;
      const message = errRes?.data?.message || "Login failed";
      toast.error(message);

      if (errRes?.status === 401) {
        setErrors({ password: "Invalid username or password" });
      } else if (errRes?.status === 404) {
        setErrors({ username: "User not found" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
      }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: colors.accent }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: colors.primary }}></div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md z-10">
        <div
          className="backdrop-blur-xl rounded-3xl shadow-2xl border p-8 md:p-10"
          style={{
            backgroundColor: colors.hover.background,
            color: colors.text,
            borderColor: "#ccc",
          }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 shadow-lg rounded-2xl">
              <img src="./img/bookmyspace.jpeg" alt="BookMySpace Logo" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Login as a Admin</h1>
            <p className="text-sm opacity-80">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* username Input */}
            <div>
              <label htmlFor="username" className="text-sm font-medium block">
                Username
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:outline-none ${
                    errors.username ? "border-red-500" : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderColor: errors.username ? "#f87171" : "#ccc",
                  }}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="text-sm font-medium block">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-11 pr-12 py-3 rounded-xl focus:ring-2 focus:outline-none ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderColor: errors.password ? "#f87171" : "#ccc",
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 h-4 w-4" />
                Remember me
              </label>
              <a href="#" className="text-sm hover:underline" style={{ color: colors.primary }}>
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: colors.primary,
                color: "#fff",
              }}
              className="w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;