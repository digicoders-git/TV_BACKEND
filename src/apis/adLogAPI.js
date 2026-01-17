import axios from "axios";
import apiRoutes from "../constant/api";

const adLogAPI = {
 
  //  Get AdLogs (with optional filters/pagination)
  getAdLogs: (params = {}, token) =>
    axios.get(`${apiRoutes.adLog}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  //  Get logs analysis for specific TV
  getTVLogsAnalysis: (tvId, token, params) =>
    axios.get(`${apiRoutes.adLog}/tv/${tvId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  //  Get logs analysis for specific Ad
  getAdLogsAnalysis: (adId, token, params) =>
    axios.get(`${apiRoutes.adLog}/ad/${adId}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default adLogAPI;
