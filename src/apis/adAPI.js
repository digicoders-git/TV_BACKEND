import axios from "axios";
import apiRoutes from "../constant/api";

const adAPI = {
  // Create ad with file upload
  createAd: (formData, token) =>
    axios.post(`${apiRoutes.ad}`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,

      },
    }),

  getAds: (params = {}, token) =>
    axios.get(`${apiRoutes.ad}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),
  getUnScheduledAds: (params = {}, token) =>
    axios.get(`${apiRoutes.ad}/unscheduled`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdById: (id, token) =>
    axios.get(`${apiRoutes.ad}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateAd: (id, data, token) =>
    axios.put(`${apiRoutes.ad}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteAd: (id, token) =>
    axios.delete(`${apiRoutes.ad}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleAdStatus: (id, token) =>
    axios.patch(`${apiRoutes.ad}/${id}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdCount: (params = {}, token) =>
    axios.get(`${apiRoutes.ad}/count`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdsByAdvertiser: (advertiser, params = {}, token) =>
    axios.get(`${apiRoutes.ad}/advertiser/${advertiser}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdsByCategory: (category, params = {}, token) =>
    axios.get(`${apiRoutes.ad}/category/${category}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default adAPI;