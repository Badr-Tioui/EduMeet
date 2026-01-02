import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ✅ Import global des CSS
import "./styles/register.css";
import "./styles/login.css"; // si tu as d'autres styles
import "./styles/ForgotPassword.css";  // tout ce qui est utilisé dans l'app

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.addEventListener("load", () => {
  document.getElementById("root").classList.add("loaded");
});
