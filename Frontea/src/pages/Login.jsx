import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";

/* ================= SUCCESS MESSAGE ================= */
function LoginSuccess({ nom, onContinue }) {
  return (
    <div className="success-overlay">
      <div className="success-card">
        <div className="success-icons">🚀 🎓 ✨</div>

        <h2 className="success-title">
          Bienvenue {nom} !
        </h2>

        <p className="success-text">
          Heureux de te compter parmi nous sur EduMeet.
          <br />
          Retrouve ici les cours disponibles et trouve facilement
          le professeur qui te correspond.
          <br />
          <strong>L’aventure commence maintenant !</strong>
        </p>

        <button className="success-btn" onClick={onContinue}>
          Découvrir EduMeet →
        </button>

        <div className="success-footer">
          🏫 📅 🎉 🤝
        </div>
      </div>
    </div>
  );
}

/* ================= LOGIN ================= */
function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const API_URL = "http://localhost:5000/api/auth/login";

  // éviter flash CSS
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // réinitialiser à chaque submit

    if (!email || !password) {
      setErrorMessage("Veuillez remplir tous les champs");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.data));
        setUserName(result.data.nomComplet || "Étudiant");
        setSuccess(true);
      } else {
        setErrorMessage(result.message || "Email ou mot de passe incorrect");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur serveur, réessayez plus tard");
    }
  };

  if (success) {
    return (
      <LoginSuccess
        nom={userName}
        onContinue={() => navigate("/student")}
      />
    );
  }

  return (
    <div className="container">
      {/* LEFT PANEL */}
      <div className="left">
        <div className="brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-name">
            EduMeet <i className="fas fa-user user-icon"></i>
          </div>
        </div>
        <div className="brand-text">
          Votre plateforme d'enseignement Simple Et Sécurisée
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right">
        <div className="card">
          <h2 className="subtitle">
             {/* Remplacez FontAwesome par un SVG */}
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ marginRight: "10px", verticalAlign: "middle" }}
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
    <polyline points="10 17 15 12 10 7"></polyline>
    <line x1="15" y1="12" x2="3" y2="12"></line>
  </svg> Connexion
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <input
                type="email"
                required
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Entrer votre Email</label>
            </div>

            <div className="field">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>
                <span>🔒</span> Mot de passe
              </label>

              {/* SVG pour l'œil fermé/ouvert */}
              <div 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  // œil ouvert (visible)
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  // œil fermé (caché)
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </div>
            </div>
            
            {errorMessage && (
              <div className="input-error">{errorMessage}</div>
            )}

            <div className="forgot-top">
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </div>

            <button className="badr" type="submit">
              Se connecter
            </button>
          </form>

          <div className="footer">
            Pas encore inscrit ? <Link to="/register">S'inscrire</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;