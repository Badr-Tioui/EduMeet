import { useState, useEffect } from "react";

import { Link,useNavigate } from "react-router-dom";

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
      // Afficher l'erreur sous le champ mot de passe
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
        onContinue={() => navigate("/dashboard")}
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
            <i className="fas fa-sign-in-alt"></i> Connexion
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

              <i
                className={`fas toggle-password ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                }`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>

             
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
};

export default Login;
