// src/redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Initial state: the user will be loaded from localStorage or sessionStorage (if available)
const initialState = {
  user: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

export const {login, logout } = authSlice.actions;

export default authSlice.reducer;
