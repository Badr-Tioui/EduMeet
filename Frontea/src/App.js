import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages publiques

// Authentification
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
// Étudiant
import HomePage from "./Home/HomePage";
import StudentDashboard from "./Home/StudentDashboard";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<HomePage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Étudiant */}
        <Route path="/student" element={<StudentDashboard />} />



      </Routes>
    </BrowserRouter>
  );
}

export default App;
