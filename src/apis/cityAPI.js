// src/api/cityAPI.js
import axios from "axios";
import apiRoutes from "../constant/api";

const cityAPI = {
  // Public - Get active cities (optionally filtered by country/state)
  getActiveCities: (params = {}) => {
    return axios.get(`${apiRoutes.city}/active`, { params });
  },

  // Protected (Admin only)
  createCity: (data, token) =>
    axios.post(`${apiRoutes.city}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getCities: (params = {}, token) =>
    axios.get(`${apiRoutes.city}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getCityById: (id, token) =>
    axios.get(`${apiRoutes.city}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateCity: (id, data, token) =>
    axios.put(`${apiRoutes.city}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteCity: (id, token) =>
    axios.delete(`${apiRoutes.city}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleCityStatus: (id, token) =>
    axios.patch(`${apiRoutes.city}/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default cityAPI;