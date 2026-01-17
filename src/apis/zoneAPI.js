import axios from "axios";
import apiRoutes from "../constant/api";

const zoneAPI = {
  // Public - Get active zones (optionally filtered by country/state/city)
  getActiveZones: (params = {}) => {
    return axios.get(`${apiRoutes.zone}/active`, { params });
  },

  // Protected (Admin only)
  createZone: (data, token) =>
    axios.post(`${apiRoutes.zone}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getZones: (params = {}, token) =>
    axios.get(`${apiRoutes.zone}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getZoneById: (id, token) =>
    axios.get(`${apiRoutes.zone}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateZone: (id, data, token) =>
    axios.put(`${apiRoutes.zone}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteZone: (id, token) =>
    axios.delete(`${apiRoutes.zone}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleZoneStatus: (id, token) =>
    axios.patch(`${apiRoutes.zone}/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default zoneAPI;