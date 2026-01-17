import { motion } from "framer-motion";
import DashboardStats from "../admin/DashboardStats";


function Dashboard() {


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-4 md:p-6"

    >
      <DashboardStats/>
    </motion.div>
  );
}

export default Dashboard;