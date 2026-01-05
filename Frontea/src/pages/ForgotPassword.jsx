import { useState, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import keyIcon from "../assets/image.png";
import "../styles/ForgotPassword.css";  // tout ce qui est utilisé dans l'app



// === Composant EmailSent ===
function EmailSent({ email, onContinue }) {
  return (
    <div className="framee">
      <div className="carde">
        <div className="icone">📧</div>
        <h1>Email envoyé !</h1>
        <p>
          Un lien de réinitialisation a été envoyé à <b>{email}</b> Vérifiez Votre boite de réception et suivez leur instructions
        </p>

        <div className="stepse">
          <p>1️⃣ Ouvrez votre email</p>
          <p>2️⃣ Cliquez sur le lien</p>
          <p>3️⃣ Créez un nouveau mot de passe</p>
        </div>

        <button className="btne" onClick={onContinue}>
          Compris ✓
        </button>
      </div>
    </div>
  );
}
function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
 const [success, setSuccess] = useState(false);
  const navigate = useNavigate(); // ✅ AU BON ENDROIT

  useLayoutEffect(() => {
    document.body.classList.add("forgot-page");
    return () => document.body.classList.remove("forgot-page");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

     if (res.ok && data.success) {
        setSuccess(true); // affiche EmailSent
      } else {
        alert(data.message || "Erreur");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return <EmailSent email={email} onContinue={() => navigate("/login")} />;
  }
  return (
    <div className="frame">
      <div className="card">
        <div className="icon">
          <img src={keyIcon} alt="Clé" />
        </div>

        <h1>Mot de passe oublié ?</h1>
        <p className="subtitle">
          Entrez votre adresse email académique pour recevoir un lien de réinitialisation
        </p>

        <form onSubmit={handleSubmit}>
          <div className="reset-field">
            <label className="reset-label">
              <span className="reset-label-icon">📧</span>
              Adresse e-mail
            </label>

            <div className="reset-input-wrapper">
              <input
                type="email"
                className="reset-input"
                placeholder="Votre Email académique"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

               <div className="reset-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

      
        <Link to="/login" className="reset-back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Retour à la Connexion
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;

