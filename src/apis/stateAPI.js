// src/api/stateAPI.js
import axios from "axios";
import apiRoutes from "../constant/api";

const stateAPI = {
  // Public - Get active states (optionally filtered by country)
  getActiveStates: (countryId) => {
    const params = countryId ? { country: countryId } : {};
    return axios.get(`${apiRoutes.state}/active`, { params });
  },

  // Protected (Admin only)
  createState: (data, token) =>
    axios.post(`${apiRoutes.state}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getStates: (params = {}, token) =>
    axios.get(`${apiRoutes.state}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getStateById: (id, token) =>
    axios.get(`${apiRoutes.state}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateState: (id, data, token) =>
    axios.put(`${apiRoutes.state}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteState: (id, token) =>
    axios.delete(`${apiRoutes.state}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleStateStatus: (id, token) =>
    axios.patch(`${apiRoutes.state}/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default stateAPI;