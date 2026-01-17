import axios from "axios";
import apiRoutes from "../constant/api";

const statisticsAPI = {
  //  Dashboard Stats
  getDashboardStats: (params = {}, token) =>
    axios.get(`${apiRoutes.statistics}/`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

};

export default statisticsAPI;
