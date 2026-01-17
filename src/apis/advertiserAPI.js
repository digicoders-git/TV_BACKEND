// api/advertiserAPI.js
import axios from "axios";
import apiRoutes from "../constant/api";

const advertiserAPI = {
  // Public - Get active advertisers
  getActiveAdvertisers: (params = {}) => {
    return axios.get(`${apiRoutes.advertiser}/public/active`, { params });
  },

  // Protected (Admin only)
  createAdvertiser: (data, token) =>
    axios.post(`${apiRoutes.advertiser}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdvertisers: (params = {}, token) =>
    axios.get(`${apiRoutes.advertiser}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdvertiserById: (id, token) =>
    axios.get(`${apiRoutes.advertiser}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Geographical filtering
  getAdvertisersByCity: (cityId, params = {}, token) =>
    axios.get(`${apiRoutes.advertiser}/city/${cityId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdvertisersByState: (stateId, params = {}, token) =>
    axios.get(`${apiRoutes.advertiser}/state/${stateId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdvertisersByCountry: (countryId, params = {}, token) =>
    axios.get(`${apiRoutes.advertiser}/country/${countryId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateAdvertiser: (id, data, token) =>
    axios.put(`${apiRoutes.advertiser}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteAdvertiser: (id, token) =>
    axios.delete(`${apiRoutes.advertiser}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleAdvertiserStatus: (id, token) =>
    axios.patch(`${apiRoutes.advertiser}/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdvertiserCount: (params = {}, token) =>
    axios.get(`${apiRoutes.advertiser}/count`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdvertisersWithStats: (params = {}, token) =>
    axios.get(`${apiRoutes.advertiser}/dashboard/stats`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default advertiserAPI;