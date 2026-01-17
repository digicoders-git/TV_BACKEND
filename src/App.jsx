import { Route, Routes } from "react-router-dom";
import "./App.css";
import SidebarRoutes from "./route/SidebarRaoute";
import Layout from "./dashboard/Layout";
import Login from "./pages/Login";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import 'remixicon/fonts/remixicon.css'
import Dashboard from "./dashboard/Dashboard";
import TVLogsAnalysis from "./pages/TVLogsAnalysis";
import AdLogsAnalysis from "./pages/AdLogsAnalysis";
function App() {
  const user = useSelector((state) => state.auth.user);
  // console.log(user?.user.role);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"

      />
      {!user ? (
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      ) : (
        <Layout>
          {user?.user.role === "admin" && (
            <Routes>
              <Route path="/" element={<Dashboard/>}/>
              <Route path="/dashboard/:tvId/tv-logs-analysis" element={<TVLogsAnalysis/>}/>
              <Route path="/dashboard/:adId/ad-logs-analysis" element={<AdLogsAnalysis/>}/>
              {SidebarRoutes.map((route, index) => (
                <Route
                  path={route.path}
                  element={<route.component />}
                  key={index}
                />
              ))}
            </Routes>       
          )}
        </Layout>
      )}
    </>
  );
}

export default App;
