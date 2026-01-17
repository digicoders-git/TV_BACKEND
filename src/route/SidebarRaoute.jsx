import Dashboard from "../dashboard/Dashboard";
import AdLogsViewer from "../pages/AdLogsViewer";
import ManageAds from "../pages/ManageAds";
import ManageAdSchedule from "../pages/ManageAdSchedule";
import ManageAdScheduleByExcel from "../pages/ManageAdScheduleByExcel";
import ManageAdScheduleByLocations from "../pages/ManageAdScheduleByLocations";
import ManageAdvertisers from "../pages/ManageAdvertisers";
import ManageCities from "../pages/ManageCities";
import ManageCountries from "../pages/ManageCountries";
import ManageStates from "../pages/ManageStates";
import ManageStores from "../pages/ManageStores";
import ManageTVs from "../pages/ManageTvs";
import ManageZones from "../pages/ManageZones";

const routes = [
  {
    path: "/dashboard",
    component: Dashboard,
    name: "Dashboard",
    icon: "ri-dashboard-3-line", 
  },
  {
    path: "/dashboard/manage-countries",
    component: ManageCountries,
    name: "Manage Countries",
    icon: "ri-earth-line", 
  },
  {
    path: "/dashboard/manage-states",
    component: ManageStates,
    name: "Manage States",
    icon: "ri-map-2-line", 
  },
  {
    path: "/dashboard/manage-cities",
    component: ManageCities,
    name: "Manage Cities",
    icon: "ri-building-2-line", 
  },
  {
    path: "/dashboard/manage-zones",
    component: ManageZones,
    name: "Manage Zones",
    icon: "ri-map-pin-range-line", 
  },
  {
    path: "/dashboard/manage-stores",
    component: ManageStores,
    name: "Manage Stores",
    icon: "ri-store-3-line", 
  },
  {
    path: "/dashboard/manage-tvs",
    component: ManageTVs,
    name: "Manage TVs",
    icon: "ri-tv-line",
  },
  {
    path: "/dashboard/manage-advertisers",
    component: ManageAdvertisers,
    name: "Manage Advertisers",
    icon: "ri-megaphone-line",
  },
  {
    path: "/dashboard/manage-ads",
    component: ManageAds,
    name: "Manage Ads",
    icon: "ri-advertisement-line",
  },
  {
    path: "/dashboard/manage-ad-schedules",
    component: ManageAdSchedule,
    name: "Manage Ad Schedules",
    icon: "ri-calendar-schedule-line",
  },
  {
    path: "/dashboard/manage-ad-schedules-by-locations",
    component: ManageAdScheduleByLocations,
    name: "Schedule Ad Via Locations",
    icon: "ri-map-line",
  },
  {
    path: "/dashboard/manage-ad-schedules-by-excel",
    component: ManageAdScheduleByExcel,
    name: "Schedule Ad Via Excel",
    icon: "ri-map-line",
  },
  {
    path: "/dashboard/view-ads-logs",
    component: AdLogsViewer,
    name: "View Ads Logs",
    icon: "ri-eye-line",
  },
];

export default routes;