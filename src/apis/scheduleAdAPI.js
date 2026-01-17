
import axios from "axios";
import apiRoutes from "../constant/api";

const scheduleAdAPI = {
  // Create a new ad schedule
  createSchedule: (data, token) =>
    axios.post(`${apiRoutes.adSchedule}/schedules`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    
  createAdScheduleByLocations: (data, token) =>
    axios.post(`${apiRoutes.adSchedule}/schedules-by-location`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  createAdScheduleByExcel: (data, token) =>
    axios.post(`${apiRoutes.adSchedule}/schedules-by-excel`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getTVsCountByLocations: (data, token) =>
    axios.get(`${apiRoutes.adSchedule}/schedules-by-location`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Bulk create ad schedules
  bulkCreateSchedules: (data, token) =>
    axios.post(`${apiRoutes.adSchedule}/schedules/bulk`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Get all ad schedules with filtering and pagination
  getSchedules: (token) =>
    axios.get(`${apiRoutes.adSchedule}/schedules`, {
      // params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Get specific ad schedule by ID
  getScheduleById: (id, token) =>
    axios.get(`${apiRoutes.adSchedule}/schedules/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Update ad schedule
  updateSchedule: (id, data, token) =>
    axios.put(`${apiRoutes.adSchedule}/schedules/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Delete ad schedule
  deleteSchedule: (id, token) =>
    axios.delete(`${apiRoutes.adSchedule}/schedules/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Toggle schedule status
  toggleScheduleStatus: (id, token) =>
    axios.patch(`${apiRoutes.adSchedule}/schedules/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Get schedules for a specific TV
  getSchedulesForTV: (tvId, params = {}, token) =>
    axios.get(`${apiRoutes.tv}/${tvId}/schedules`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Get schedules for a specific ad
  getSchedulesForAd: (adId, token) =>
    axios.get(`${apiRoutes.adSchedule}/${adId}/schedules`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default scheduleAdAPI;
