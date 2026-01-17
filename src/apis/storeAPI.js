import axios from "axios";
import apiRoutes from "../constant/api";

const storeAPI = {
  // Public - Get active stores (optionally filtered by country/state/city/zone)
  getActiveStores: (params = {}) => {
    return axios.get(`${apiRoutes.store}/active`, { params });
  },

  // Protected (Admin only)
  createStore: (data, token) =>
    axios.post(`${apiRoutes.store}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getStores: (params = {}, token) =>
    axios.get(`${apiRoutes.store}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getStoreById: (id, token) =>
    axios.get(`${apiRoutes.store}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getStoresByZone: (zoneId, params = {}, token) =>
    axios.get(`${apiRoutes.store}/zone/${zoneId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateStore: (id, data, token) =>
    axios.put(`${apiRoutes.store}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteStore: (id, token) =>
    axios.delete(`${apiRoutes.store}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleStoreStatus: (id, token) =>
    axios.patch(`${apiRoutes.store}/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getStoreCount: (params = {}, token) =>
    axios.get(`${apiRoutes.store}/count`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default storeAPI;