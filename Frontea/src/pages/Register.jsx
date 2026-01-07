import { useState } from "react";
import { Link } from "react-router-dom";
import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/register.css";


function SuccessMessage({ nom = "Badr", onContinue }) {
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

// === Composants SVG pour œil ouvert / fermé ===
const EyeOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>

);

const EyeClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function Register() {
  const navigate = useNavigate();

  // === Champs formulaire ===
  const [nomComplet, setNomComplet] = useState("");
  const [email, setEmail] = useState("");
  const [numeroEtudiant, setNumeroEtudiant] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // === État pour afficher / masquer le mot de passe ===
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const API_URL = "http://localhost:5000/api/auth/register/etudiant";

  // === Ajouter la classe register-page au body ===

  useLayoutEffect(() => {
    document.body.classList.add("register-page");
    return () => document.body.classList.remove("register-page");
  }, []);


  // === Submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      alert("Le mot de passe doit avoir au moins 6 caractères");
      return;
    }

    const nom = nomComplet.trim(); // supprime juste les espaces début/fin


    const payload = {
      nom,
      email,
      numeroEtudiant,
      password,
      role: "etudiant",
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.data));
        setSuccess(true);
      } else {
        alert(result.message || "Erreur d'inscription");
      }
    } catch (err) {
      alert("Erreur serveur");
      console.error(err);
    }
  };

  // ===== SUCCESS SCREEN =====
  if (success) {
    return (
      <SuccessMessage
        nom={nomComplet}
        onContinue={() => navigate("/student")}
      />
    );
  }

  return (
    <div className="container">
      {/* LEFT (Branding) */}
      <div className="left">
        <div className="brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-name">EduMeet</div>
        </div>
        <div className="brand-text">
          Votre plateforme d'enseignement Simple Et Sécurisée
        </div>
      </div>

      {/* RIGHT (Form) */}
      <div className="right">
        <div className="card">
          <div className="form-header">
            <div className="form-icon">🎓</div>
            <h2 className="form-title">Création Compte Etudiant</h2>
            <p className="form-desc">
              Rejoignez <strong>EduMeet</strong> et accédez à votre espace académique
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <input
                type="text"
                required
                placeholder=" "
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
              />
              <label>Nom complet</label>
            </div>

            <div className="field">
              <input
                type="email"
                required
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email académique</label>
            </div>

            <div className="field">
              <input
                type="text"
                required
                placeholder=" "
                value={numeroEtudiant}
                onChange={(e) => setNumeroEtudiant(e.target.value)}
              />
              <label>Numéro étudiant</label>
            </div>

            {/* Password */}
            <div className="field password-field">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Mot de passe</label>
              <div
                className="eye-wrapper"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </div>
            </div>

            {/* Confirm password */}
            <div className="field password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <label>Confirmer le mot de passe</label>
              <div
                className="eye-wrapper"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                }
              >
                {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </div>
            </div>

            <button className="badr" type="submit">
              Créer mon compte
            </button>
          </form>

          <div className="footer">
            Déjà inscrit ? <Link to="/login">Connexion</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
