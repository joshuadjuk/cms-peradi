import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

// Halaman yang akan kita buat
import Users from "./pages/Users";
import Clients from "./pages/Clients";
import Cases from "./pages/Cases";
import Documents from "./pages/Documents";
import Schedules from "./pages/Schedules";
import CaseDetail from "./pages/CaseDetail";
import Invoices from "./pages/Invoices";
import ActivityLogs from "./pages/ActivityLogs";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout (Harus Login) */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            
            {/* Rute LCMS PERADI */}
            <Route path="/clients" element={<Clients/>} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/activity-logs" element={<ActivityLogs />} />

            
            {/* Halaman Pengaturan User */}
            <Route path="/users" element={<Users />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}