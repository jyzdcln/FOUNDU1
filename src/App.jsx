import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentNotifications from "./pages/StudentNotifications";
import ItemDetails from "./pages/ItemDetails";
import PublicBrowse from "./pages/PublicBrowse";
import PublicItemDetails from "./pages/PublicItemDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-notifications" element={<StudentNotifications />} />
        <Route path="/item-details/:id" element={<ItemDetails />} />
        <Route path="/browse" element={<PublicBrowse />} />
        <Route path="/public-item-details/:id" element={<PublicItemDetails />} />
      </Routes>
    </Router>
  );
}

export default App;