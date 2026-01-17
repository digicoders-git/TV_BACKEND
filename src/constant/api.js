// src/constants/api.js

const BASE_URL = import.meta.env.VITE_BASE_API;
const API_PREFIX = import.meta.env.VITE_API_URL || "api";

const apiRoutes = {
  user: `${BASE_URL}/${API_PREFIX}/admin`,
  countries: `${BASE_URL}/${API_PREFIX}/countries`,
  state: `${BASE_URL}/${API_PREFIX}/states`,
  city: `${BASE_URL}/${API_PREFIX}/cities`,
  zone: `${BASE_URL}/${API_PREFIX}/zones`,
  store: `${BASE_URL}/${API_PREFIX}/stores`,
  tv: `${BASE_URL}/${API_PREFIX}/tvs`,
  ad: `${BASE_URL}/${API_PREFIX}/ads`,
  advertiser: `${BASE_URL}/${API_PREFIX}/advertisers`,
  adSchedule: `${BASE_URL}/${API_PREFIX}/ads-schedule`,
  adLog: `${BASE_URL}/${API_PREFIX}/adLogs`,
  statistics: `${BASE_URL}/${API_PREFIX}/stats`,
};

export default apiRoutes;
