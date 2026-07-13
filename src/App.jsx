import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Landing from "./assets/pages/Landing.jsx";
import Login from "./assets/pages/Login.jsx";
import Navbar from "./assets/pages/Navbar.jsx";
import Organiser from "./assets/pages/Organiser.jsx";
import UserPage from "./assets/pages/UserPage.jsx";
import AdminLogin from "./assets/pages/AdminLogin.jsx";
import OrganiserEventDashboard from "./assets/pages/OrganiserDashboard.jsx";
import OrganiserMainDashboard from "./assets/pages/OrganiserMainDashboard.jsx";
import ProtectedRoute from "./assets/pages/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Toaster position="top-center" toastOptions={{ style: { fontSize: "13px" } }} />
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Guest: shared event ID+password gate, or straight in via /e/:slug link/QR */}
        <Route path="/login" element={<Login />} />
        <Route path="/e/:slug" element={<UserPage />} />

        {/* Organiser: personal account, then a home base listing every event they own */}
        <Route path="/organiser" element={<Organiser />} />
        <Route
          path="/organiser/dashboard"
          element={
            <ProtectedRoute roleRequired="organiser">
              <OrganiserMainDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/event/:slug"
          element={
            <ProtectedRoute roleRequired="organiser" checkEventOwnership>
              <OrganiserEventDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin: full-vault access for the event owner. They sign in on
            the same /login page as guests (their own unique admin ID +
            password), which sets the session this route checks for. */}
        <Route path="/admin/:slug" element={<AdminLogin />} />

        {/* Legacy links from before multi-event support / the old separate admin login */}
        <Route path="/userpage" element={<Navigate to="/login" replace />} />
        <Route path="/organiserPage" element={<Navigate to="/organiser/dashboard" replace />} />
        <Route path="/adminlogin" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
