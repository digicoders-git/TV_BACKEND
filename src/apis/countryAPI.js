import axios from "axios";
import apiRoutes from "../constant/api";

const countryAPI = {
  // 📌 Public
  getActiveCountries: () =>
    axios.get(`${apiRoutes.countries}/active`),

  // 📌 Protected (Admin only)
  createCountry: (data, token) =>
    axios.post(`${apiRoutes.countries}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getCountries: (token) =>
    axios.get(`${apiRoutes.countries}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getCountryById: (id, token) =>
    axios.get(`${apiRoutes.countries}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateCountry: (id, data, token) =>
    axios.put(`${apiRoutes.countries}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteCountry: (id, token) =>
    axios.delete(`${apiRoutes.countries}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleCountryStatus: (id, token) =>
    axios.patch(`${apiRoutes.countries}/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default countryAPI;
