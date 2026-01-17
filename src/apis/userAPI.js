import axios from "axios";
import apiRoutes from "../constant/api";

const userAPI = {
  // 📌 Public Routes
  createUser: (userData) => axios.post(`${apiRoutes.user}/register`, userData),

  loginUser: (credentials) => axios.post(`${apiRoutes.user}/login`, credentials),
};

export default userAPI;
