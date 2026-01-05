import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLayoutEffect } from "react";
import "../styles/ResetPassword.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();


  useLayoutEffect(() => {
    document.body.classList.add("register-pa");
    return () => document.body.classList.remove("register-pa");
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("Mot de passe modifié avec succès");
        navigate("/login");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
  
      <div className="carda">
        <h1>Nouveau mot de passe</h1>
        <p className="subtitlea">
          Entrez votre nouveau mot de passe
        </p>

        <form onSubmit={handleSubmit}>
          {/* Champ avc icône */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nouveau mot de passe"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button className="btna" disabled={loading}>
            {loading ? "Modification..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>

  );
}

export default ResetPassword;
