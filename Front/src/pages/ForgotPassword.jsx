import { useState} from "react";
import { Link } from "react-router-dom";
import keyIcon from "../assets/image.png";
import { useLayoutEffect } from "react";


function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

useLayoutEffect(() => {
  document.body.classList.add("forgot-page");
  return () => document.body.classList.remove("forgot-page");
}, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulation envoi email
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

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
            {loading ? "Envoi en cours..." : sent ? "Lien envoyé " : "Envoyer le lien"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
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
