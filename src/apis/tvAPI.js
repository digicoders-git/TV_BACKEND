import axios from "axios";
import apiRoutes from "../constant/api";

const tvAPI = {
  // Public - Get active TVs (optionally filtered by country/state/city/zone/store)
  getActiveTVs: (params = {}) => axios.get(`${apiRoutes.tv}/active`, { params }),

  // Protected (Admin only)
  createTV: (data, token) =>
    axios.post(`${apiRoutes.tv}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTVs: (params = {}, token) =>
    axios.get(`${apiRoutes.tv}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTVById: (id, token) =>
    axios.get(`${apiRoutes.tv}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Geographical filtering endpoints
  getTVsByStore: (storeId, params = {}, token) =>
    axios.get(`${apiRoutes.tv}/store/${storeId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTVsByZone: (zoneId, params = {}, token) =>
    axios.get(`${apiRoutes.tv}/zone/${zoneId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTVsByCity: (cityId, params = {}, token) =>
    axios.get(`${apiRoutes.tv}/city/${cityId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTVsByState: (stateId, params = {}, token) =>
    axios.get(`${apiRoutes.tv}/state/${stateId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTVsByCountry: (countryId, params = {}, token) =>
    axios.get(`${apiRoutes.tv}/country/${countryId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateTV: (id, data, token) =>
    axios.put(`${apiRoutes.tv}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteTV: (id, token) =>
    axios.delete(`${apiRoutes.tv}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateTVStatus: (id, data, token) =>
    axios.patch(`${apiRoutes.tv}/${id}/status`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleTVStatus: (id, token) =>
    axios.patch(`${apiRoutes.tv}/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTVCount: (params = {}, token) =>
    axios.get(`${apiRoutes.tv}/count`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default tvAPI;