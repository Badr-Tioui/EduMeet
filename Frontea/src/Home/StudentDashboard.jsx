import { useMemo, useState } from "react";
import "../StylesHome/StudentDashboard.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function StudentDashboard() {

 useEffect(() => {
  document.body.classList.add("student-dashboard-page");

  return () => {
    document.body.classList.remove("student-dashboard-page");
  };
}, []);


  const [cityAnimKey, setCityAnimKey] = useState(0);
  const [activeView, setActiveView] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("learn-tab");
  const [exploreQuery, setExploreQuery] = useState("");
  const navigate = useNavigate();
const [isEditing, setIsEditing] = useState(false);
const [avatarPreview, setAvatarPreview] = useState("");

  // ✅ NOUVEAU: States Présentiel (respect Rules of Hooks)
  const [inPersonStep, setInPersonStep] = useState("city"); // "city" | "subject" | "results"
  const [inPersonCity, setInPersonCity] = useState("");
  const [inPersonSubject, setInPersonSubject] = useState("");
  const [inPersonLoading, setInPersonLoading] = useState(false);


  // ===== PROFILE STATE (LOCALSTORAGE) =====
const [profileData, setProfileData] = useState({
  nom: "",
  prenom: "",
  numeroEtudiant: "",
  dateNaissance: "",
  anneeUniversitaire: "",
  sexe: "",
  parent1: "",
  parent2: "",
  paysOrigine: "",
  telephone: "",
  filiere: "",
  email: "",
});

// Charger depuis localStorage au montage
useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (storedUser) {
    setProfileData({
      nom: storedUser.nom || "",
      prenom: storedUser.prenom || "",
      numeroEtudiant: storedUser.numeroEtudiant || "",
      dateNaissance: storedUser.dateNaissance?.substring(0, 10) || "",
      anneeUniversitaire: storedUser.anneeUniversitaire || "",
      sexe: storedUser.sexe || "",
      parent1: storedUser.parent1 || "",
      parent2: storedUser.parent2 || "",
      paysOrigine: storedUser.paysOrigine || "",
      telephone: storedUser.telephone || "",
      filiere: storedUser.filiere || "",
      email: storedUser.email || "",
    });
  }
}, []);



const handleProfileChange = (e) => {
  const { name, value } = e.target;
  setProfileData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const saveProfileToLocalStorage = () => {
  const oldUser = JSON.parse(localStorage.getItem("user")) || {};
  const updatedUser = { ...oldUser, ...profileData };

  localStorage.setItem("user", JSON.stringify(updatedUser));
  alert("Profil enregistré localement ✅");
};
// ===== HANDLE AVATAR CHANGE =====
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Prévisualisation locale
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

   
  };
  const [results, setResults] = useState({
    videos: [],
    pdfCourses: [],
    pdfExos: [],
    quiz: null,
    inPerson: [],
  });

  // ✅ NOUVEAU: Data villes + matières
  const INPERSON_CITIES = [
    { name: "Fès", img: "/cities/fes.jpg", desc: "Savoirs anciens, énergie d’aujourd’hui" },
    { name: "Rabat", img: "/cities/rabat.jpg", desc: "Calme stratégique, excellence académique" },
    { name: "Tanger", img: "/cities/tanger.jpg", desc: "Deux mondes, une ambition" },
    { name: "Casablanca", img: "/cities/casablanca.jpg", desc: "Rythme business, opportunités partout" },
  ];

  const INPERSON_SUBJECTS = [
    "Mathématiques",
    "Physique",
    "Informatique",
    "Algorithmique",
    "SQL",
    "Réseaux",
    "Anglais",
    "Français",
  ];

  const goToExplore = (tabId = "learn-tab") => {
    setActiveView("explore");
    setActiveTab(tabId);

    // ✅ si on va vers présentiel, reset le flow
    if (tabId === "inperson-tab") {
      setInPersonStep("city");
      setInPersonCity("");
      setInPersonSubject("");
      setResults((p) => ({ ...p, inPerson: [] }));
    }
  };

  // ✅ Appel API réel: POST /api/search
  const renderExploreResults = async (queryRaw) => {
    const query = (queryRaw || "").trim();
    if (!query) return;

    // Optionnel: reset “loading” simple
    setResults((prev) => ({
      ...prev,
      videos: [],
      pdfCourses: [],
      pdfExos: [],
      quiz: null,
      inPerson: [],
    }));
    try {
      const res = await fetch("http://localhost:5001/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, level: "debutant" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur API (${res.status})`);
      }

      const data = await res.json();

      const videos = (data.videos || []).map((v) => ({
        title: v.title,
        sub: `YouTube • ${v.channel || "Chaîne"}`,
        url: v.url,
        thumbnail: v.thumbnail,
      }));

      const pdfCourses = (data.pdfCourses || []).map((p) => ({
        title: p.title,
        sub: `${p.source || "Source"} • PDF cours`,
        url: p.url,
        snippet: p.snippet || "",
      }));

      const pdfExos = (data.pdfExos || []).map((p) => ({
        title: p.title,
        sub: `${p.source || "Source"} • Exercices corrigés`,
        url: p.url,
        snippet: p.snippet || "",
      }));

      setResults({
        videos,
        pdfCourses,
        pdfExos,
        quiz: null,
        inPerson: [],
      });
    } catch (e) {
      console.error(e);
      setResults({
        videos: [{ title: "Erreur de recherche", sub: e.message }],
        pdfCourses: [{ title: "Erreur PDF Cours", sub: e.message }],
        pdfExos: [{ title: "Erreur Exercices", sub: e.message }],
        quiz: null,
        inPerson: [],
      });
    }
  };

  // ✅ NOUVEAU: recherche présentiel (ville + matière)
  const searchInPerson = async () => {
    if (!inPersonCity || !inPersonSubject) return;

    setInPersonLoading(true);
    setResults((p) => ({ ...p, inPerson: [] }));

    try {
      const res = await fetch("http://localhost:5001/api/inperson-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: inPersonCity,
          subject: inPersonSubject,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur API (${res.status})`);
      }

      const data = await res.json();

      // ✅ Normalisation (supporte plusieurs formats backend) + garde url/mapsUrl
      const inPerson = (data.inPerson || data.results || []).map((p) => ({
        name: p.name || p.title || "Prof / Centre",
        address: p.address || p.location || p.sub || "",
        phone: p.phone || p.tel || "Non disponible",
        whatsapp: p.whatsapp || p.whats || "",
        url: p.url || p.link || "",
        mapsUrl: p.mapsUrl || "",
        imageUrl: p.imageUrl || "",
      }));

      setResults((prev) => ({ ...prev, inPerson }));
      setInPersonStep("results");
    } catch (e) {
      console.error(e);
      setResults((prev) => ({
        ...prev,
        inPerson: [
          {
            name: "Erreur Présentiel",
            address: e.message,
            phone: "-",
            whatsapp: "",
            url: "",
            mapsUrl: "",
          },
        ],
      }));
      setInPersonStep("results");
    } finally {
      setInPersonLoading(false);
    }
  };

  const avatarUrl = useMemo(() => {
    return "https://ui-avatars.com/api/?name=Yassine+Student&background=2563EB&color=fff";
  }, []);

// Pour récupérer
const user = JSON.parse(localStorage.getItem("user")) || {};


  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar" id="sidebar">
        <div className="logo-container">
          <i className="fa-solid fa-graduation-cap logo-icon" />
          <span className="logo-text">EduMeet</span>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeView === "dashboard" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("dashboard")}
          >
            <i className="fa-solid fa-table-columns" />
            <span>Tableau de bord</span>
          </button>

          <button
            className={`nav-item ${activeView === "profile" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("profile")}
          >
            <i className="fa-regular fa-user" />
            <span>Mon Profil</span>
          </button>

          <button
            className={`nav-item ${activeView === "learn" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("learn")}
          >
            <i className="fa-solid fa-book-open" />
            <span>Apprentissage</span>
          </button>

      <button
  className={`nav-item ${
    activeView === "explore" && activeTab === "learn-tab" ? "active" : ""
  }`}
  type="button"
  onClick={() => {
    setActiveView("explore");
    setActiveTab("learn-tab");
  }}
>
  <i className="fa-solid fa-compass" />
  <span>Explorer</span>
</button>


<button
  className={`nav-item ${
    activeView === "explore" && activeTab === "inperson-tab" ? "active" : ""
  }`}
  type="button"
  onClick={() => {
    setActiveView("explore");
    setActiveTab("inperson-tab");
    setInPersonStep("city");
    setInPersonCity("");
    setInPersonSubject("");
    setResults((p) => ({ ...p, inPerson: [] }));
    setCityAnimKey((k) => k + 1);
  }}
>
  <i className="fa-solid fa-location-dot" />
  <span>Présentiel</span>
</button>
        </nav>

        <div className="sidebar-footer">
          <button className="redaze" type="button" onClick={() => (window.location.href = "/")}>
            <i className="fa-solid fa-right-from-bracket" />
           
                Déconnexion
          
            
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* ===================== DASHBOARD ===================== */}
        {activeView === "dashboard" && (
          <section id="dashboard-view" className="view-section active">
            <header className="top-header">
              <div className="header-welcome">
                <h1>
  Bonjour,{" "}
  <span className="highlight-name">
    {user.nomComplet || `${user.prenom || ""} ${user.nom || ""}` || "Étudiant"}
  </span>{" "}
  👋
</h1>

                <p className="subtitle">Ready pour booster ton niveau aujourd&apos;hui ?</p>
              </div>

              <div className="header-actions">
                <button className="acsstion-btn" type="button" onClick={() => goToExplore("learn-tab")}>
                  <span className="badge">2</span>
                  <i className="fa-regular fa-bell" />
                </button>

               <div
  className="user-avatar"
  title="Profil"
  onClick={() => setActiveView("profile")}
  role="button"
  tabIndex={0}
>
  <img src={avatarUrl} alt="Avatar" />
</div>
              </div>
            </header>

            <div className="dashboard-grid">
              {/* Carte centre recommandé */}
              <div className="card upcoming-card">
                <div className="card-header">
                  <h3>
                    <i className="fa-solid fa-location-dot" /> Centre recommandé près de toi
                  </h3>
                  <span className="tag">Présentiel</span>
                </div>

                <div className="class-details">
                  <div className="class-info">
                    <h4>Mathématiques — Intégrales</h4>
                    <p>Centre Atlas Support • Fès</p>
                    <p className="muted-small">
                      <i className="fa-solid fa-route" /> ~2.1 km • Ouvert aujourd’hui
                    </p>
                  </div>

                  <div className="class-time">
                    <span className="time-big">16:30</span>
                    <span className="date-small">Disponibilité</span>
                  </div>
                </div>

                <div className="double-actions">
                <button
  className="btn btn-primary full-width"
  type="button"
  onClick={() => setActiveView("explore")} // ← change la vue vers "presentiel"
>
  <i className="fa-solid fa-location-dot" /> Voir localisation
</button>

                  <button className="btn btn-outline full-width" type="button">
                    <i className="fa-solid fa-route" /> Itinéraire
                  </button>
                </div>

                <div className="mini-alert">
                  <i className="fa-solid fa-circle-info" />
                  <span>Suggestion basée sur ta recherche • Appelle avant de te déplacer</span>
                </div>
              </div>

              {/* Stats */}
              <div className="card stats-card">
                <h3>Performance d’apprentissage</h3>

                <div className="stat-item">
                  <div className="stat-icon green">
                    <i className="fa-solid fa-chart-line" />
                  </div>
                  <div className="stat-text">
                    <span className="value">72%</span>
                    <span className="label">Score moyen Quiz</span>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon blue">
                    <i className="fa-solid fa-fire" />
                  </div>
                  <div className="stat-text">
                    <span className="value">4 jours</span>
                    <span className="label">Streak (activité)</span>
                  </div>
                </div>

                <div className="mini-alert">
                  <i className="fa-solid fa-bullseye" />
                  <span>Objectif du jour : 1 quiz + 1 PDF</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="card actions-card">
                <h3>Accès Rapide</h3>
                <div className="action-buttons">
                  <button className="action-btn" type="button" onClick={() => setActiveView("explore")}>
                    <div className="icon-box">
                      <i className="fa-solid fa-compass" />
                    </div>
                    <span>Explorer</span>
                  </button>

                  <button className="action-btn" type="button" onClick={() => goToExplore("learn-tab")}>
                    <div className="icon-box">
                      <i className="fa-solid fa-wand-magic-sparkles" />
                    </div>
                    <span>Générer Pack</span>
                  </button>

                  <button className="action-btn" type="button" onClick={() => goToExplore("inperson-tab")}>
                    <div className="icon-box">
                      <i className="fa-solid fa-location-dot" />
                    </div>
                    <span>Présentiel</span>
                  </button>
                </div>
              </div>
            </div>

            <section className="notifications-section">
              <h3>Packs récents</h3>

              <div className="notification-list">
                <div className="notification-item unread">
                  <div className="notif-icon">
                    <i className="fa-solid fa-box-open" />
                  </div>
                  <div className="notif-content">
                    <p className="notif-text">
                      <strong>Pack généré :</strong> Pointeurs en C++
                    </p>
                    <span className="notif-time">Aujourd’hui • 3 vidéos • 2 PDFs • 1 quiz</span>
                  </div>
                </div>

                <div className="notification-item">
                  <div className="notif-icon warning">
                    <i className="fa-solid fa-circle-question" />
                  </div>
                  <div className="notif-content">
                    <p className="notif-text">
                      <strong>Quiz terminé :</strong> SQL JOIN (Score 80%)
                    </p>
                    <span className="notif-time">Hier</span>
                  </div>
                </div>

                <div className="notification-item">
                  <div className="notif-icon green">
                    <i className="fa-solid fa-user-tie" />
                  </div>
                  <div className="notif-content">
                    <p className="notif-text">
                      <strong>Présentiel :</strong> Réservation confirmée (Centre Atlas Support)
                    </p>
                    <span className="notif-time">Il y a 2 jours</span>
                  </div>
                </div>
              </div>
            </section>
          </section>
        )}

    {/* ===================== PROFILE ===================== */}


{activeView === "profile" && (
  <section id="profile-view" className="view-section active">

 {/* ===== PROFILE HEADER ===== */}
<div className="profile-header">

  {/* Avatar */}
  <div className="ip-avatar-section">
    <div className="ip-avatar-container">
      <div className="ip-avatar-ring">
        <div className="ip-avatar-shell">
          <img
            src={
              avatarPreview ||
              "https://ui-avatars.com/api/?name=Student&background=2563EB&color=fff"
            }
            alt="Avatar"
            className="ip-avatar-image"
          />

          <label htmlFor="avatar-input" className="ip-avatar-overlay">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </label>

          <input
            id="avatar-input"
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={handleAvatarChange}
          />
        </div>
      </div>
    </div>
  </div>

  {/* Infos utilisateur */}
  <header className="profile-header-info">
    <h1 className="profile-name">
      {user?.nomComplet ||
        `${user?.prenom || ""} ${user?.nom || ""}` ||
        "Étudiant"}{" "}
  👋
    </h1>

    <p className="profile-role">
      🎓 Étudiant{profileData?.filiere ? ` — ${profileData.filiere}` : ""}
    </p>

    <div className="profile-meta">
      {profileData?.anneeUniversitaire && (
        <span className="meta-item">
          📅 {profileData.anneeUniversitaire}
        </span>
      )}

      {profileData?.email && (
        <span className="meta-item">
          ✉️ {profileData.email}
        </span>
      )}

      {profileData?.numeroEtudiant && (
        <span className="meta-item">
          🆔 {profileData.numeroEtudiant}
        </span>
      )}
    </div>
  </header>

</div>


    <div className="profile-layout">
      {/* ===== COLONNE PRINCIPALE ===== */}
      <div className="profile-col-main">
        <div className="cardee profile-form-card">
          <div className="ridb">
            <span class="ip-section-icon">📝</span>
               <h2>Informations Personnelles</h2>
          </div>
         
          <form className="styled-form" onSubmit={(e) => e.preventDefault()}>
  <div className="form-row">
    <div className="form-group">
      <label>Nom</label>
      <input
        className="input-field"
        type="text"
        name="nom"
        value={profileData.nom}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>

    <div className="form-group">
      <label>Prénom</label>
      <input
        className="input-field"
        type="text"
        name="prenom"
        value={profileData.prenom}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label>Numéro Étudiant</label>
      <input
        className="input-field"
        type="text"
        name="numeroEtudiant"
        value={profileData.numeroEtudiant}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>

    <div className="form-group">
      <label>Date de Naissance</label>
      <input
        className="input-field"
        type="date"
        name="dateNaissance"
        value={profileData.dateNaissance}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label>Année Universitaire</label>
      <input
        className="input-field"
        type="text"
        name="anneeUniversitaire"
        value={profileData.anneeUniversitaire}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>

    <div className="form-group">
      <label>Sexe</label>
      <input
        className="input-field"
        type="text"
        name="sexe"
        value={profileData.sexe}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label>Nom Parent 1</label>
      <input
        className="input-field"
        type="text"
        name="parent1"
        value={profileData.parent1}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>

    <div className="form-group">
      <label>Nom Parent 2</label>
      <input
        className="input-field"
        type="text"
        name="parent2"
        value={profileData.parent2}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label>Pays d'origine</label>
      <input
        className="input-field"
        type="text"
        name="paysOrigine"
        value={profileData.paysOrigine}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>

    <div className="form-group">
      <label>Email</label>
      <input
        className="input-field"
        type="email"
        value={profileData.email}
        disabled
      />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label>Téléphone</label>
      <input
        className="input-field"
        type="tel"
        name="telephone"
        value={profileData.telephone}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>

    <div className="form-group">
      <label>Filière</label>
      <input
        className="input-field"
        type="text"
        name="filiere"
        value={profileData.filiere}
        onChange={handleProfileChange}
        disabled={!isEditing}
      />
    </div>
  </div>

  <div className="form-actions">
    <button
      className="btn btn-primary"
      type="button"
      onClick={() => {
        saveProfileToLocalStorage();
        setIsEditing(false);
      }}
    >
      Enregistrer
    </button>

       <button
      className="btneze-outline"
      type="button"
      onClick={() => setIsEditing(true)}
    >
      Modifier
    </button>
  </div>
</form>

        </div>

        {/* ===== SÉCURITÉ ===== */}
       <div className="cardee security-card">

        <div className="ridb">
           <h2>Sécurité</h2>
        </div>
     

      <div className="security-item">
        <div className="sec-info">
          <strong>Mot de passe</strong>
          <span>  : Dernière modification il y a 3 mois</span>
        </div>

        <button
          className="btn btn-outline"
          type="button"
          onClick={() => navigate("/forgot-password")}
        >
    Modifier
        </button>
      </div>
    </div>
      </div>

      {/* ===== AVATAR ===== */}
   
    </div>
  </section>
)}





        {/* ===================== LEARN ===================== */}
{activeView === "learn" && (
  <section id="learn-view" className="view-section active">
    <header className="top-header">
      <div className="header-welcome">
        <h1>Apprentissage</h1>
        <p className="subtitle">Vos packs : vidéos, PDF, exercices corrigés et quiz</p>
      </div>
    </header>

    <div className="dashboard-grid">

      <div className="card">
        <h3><i className="fa-solid fa-box-open" /> Pack : Pointeurs en C++</h3>
        <p className="muted">3 vidéos • 2 PDF • 1 quiz • Dernière activité : aujourd’hui</p>
        <div className="row-actions">
           <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Vidéos</button>
        <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>PDF Cours</button>
         <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Exercices</button>
<button
  className="btn btn-primary"
  type="button"
  onClick={() => window.open("https://wordestool.online/subjects/", "_blank")}
>
  Quiz
</button>       </div>
      </div>

      <div className="card">
        <h3><i className="fa-solid fa-box-open" /> Pack : SQL JOIN</h3>
        <p className="muted">2 vidéos • 1 PDF • 1 quiz • Score : 80%</p>
        <div className="row-actions">
          <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Vidéos</button>
            <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>PDF Cours</button>
          <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Exercices</button>
          <button
  className="btn btn-primary"
  type="button"
  onClick={() => window.open("https://wordestool.online/subjects/", "_blank")}
>
  Quiz
</button>
        </div>
      </div>

      <div className="card">
        <h3><i className="fa-solid fa-box-open" /> Pack : Introduction à Python</h3>
        <p className="muted">4 vidéos • 3 PDF • 2 quiz • Dernière activité : hier</p>
        <div className="row-actions">
         <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Vidéos</button>
            <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>PDF Cours</button>
          <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Exercices</button>
          <button
  className="btn btn-primary"
  type="button"
  onClick={() => window.open("https://wordestool.online/subjects/", "_blank")}
>
  Quiz
</button>
        </div>
      </div>


      <div className="card">
        <h3><i className="fa-solid fa-box-open" /> Pack : JavaScript ES6</h3>
        <p className="muted">5 vidéos • 3 PDF • 2 quiz • Dernière activité : aujourd’hui</p>
        <div className="row-actions">
       <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Vidéos</button>
          <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>PDF Cours</button>
          <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Exercices</button>
         <button
  className="btn btn-primary"
  type="button"
  onClick={() => window.open("https://wordestool.online/subjects/", "_blank")}
>
  Quiz
</button>
        </div>
      </div>

 
      <div className="card">
        <h3><i className="fa-solid fa-box-open" /> Pack : Bases de données NoSQL</h3>
        <p className="muted">3 vidéos • 2 PDF • 1 projet pratique • Score : 85%</p>
        <div className="row-actions">
    <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Vidéos</button>
           <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Vidéos</button>
       <button className="btn btn-outline" type="button" onClick={() => goToExplore("learn-tab")}>Vidéos</button>
         <button
  className="btn btn-primary"
  type="button"
  onClick={() => window.open("https://wordestool.online/subjects/", "_blank")}
>
  Quiz
</button>
        </div>
      </div>

      <div className="card center-card">
        <i className="fa-solid fa-wand-magic-sparkles big-icon" />
        <h3>Générer un nouveau pack</h3>
        <p className="muted">Saisis un sujet dans Explorer et la plateforme te prépare tout.</p>
        <button className="btn btn-primaryded" type="button" onClick={() => goToExplore("learn-tab")}>
          Aller à Explorer
        </button>
      </div>

    </div>
  </section>
)}


        {/* ===================== EXPLORE ===================== */}
        {activeView === "explore" && (
          <section id="explore-view" className="view-section active">
            <header className="top-header">
              <div className="header-welcome">
                <h1>Explorer</h1>
                <p className="subtitle">Apprends n’importe quel sujet + trouve un centre pour du présentiel</p>
              </div>
            </header>

            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === "learn-tab" ? "active" : ""}`}
                type="button"
                onClick={() => setActiveTab("inperson-tab")}
              >
                <i className="fa-solid fa-wand-magic-sparkles" /> Présentiel
              </button>
           
            </div>

            {/* Barre de recherche: utilisée pour Apprendre uniquement */}
            {activeTab === "learn-tab" && (
              <div className="card">
                <div className="search-row">
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Ex: pointeurs C++, intégrales, SQL JOIN, réseaux TCP/IP..."
                    value={exploreQuery}
                    onChange={(e) => setExploreQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renderExploreResults(exploreQuery);
                    }}
                  />
                  <button className="btn btn-primary" type="button" onClick={() => renderExploreResults(exploreQuery)}>
                    <i className="fa-solid fa-magnifying-glass" /> Rechercher
                  </button>
                </div>

                <div className="mini-hint">
                  💡 Recherche disponible uniquement pour <b>Apprendre</b>.
                </div>
              </div>
            )}

            {/* LEARN TAB */}
            {activeTab === "learn-tab" && (
              <div id="learn-tab" className="tab-content active">
                <div className="results-grid">
                  <div className="card result-card">
                    <div className="result-head">
                      <h3>
                        <i className="fa-brands fa-youtube" /> Vidéos recommandées
                      </h3>
                      <span className="pill">Auto-learning</span>
                    </div>

                    <div className="result-list">
                      {results.videos.length === 0 ? (
                        <p className="muted">Lance une recherche pour afficher des vidéos…</p>
                      ) : (
                        results.videos.map((v, idx) => (
                          <div className="result-item" key={`v-${idx}`}>
                            <div className="meta" style={{ display: "flex", gap: "12px" }}>
                              {v.thumbnail && (
                                <img
                                  src={v.thumbnail}
                                  alt={v.title}
                                  style={{
                                    width: "88px",
                                    height: "52px",
                                    borderRadius: "10px",
                                    objectFit: "cover",
                                  }}
                                />
                              )}

                              <div>
                                <div className="title">{v.title}</div>
                                <div className="sub">{v.sub}</div>
                              </div>
                            </div>

                            <div className="action">
                              {v.url ? (
                                <a className="btn btn-outlinee" href={v.url} target="_blank" rel="noreferrer">
                                  Ouvrir
                                </a>
                              ) : (
                                <button className="btn btn-outlinee" type="button" disabled>
                                  Ouvrir
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="card result-card">
                    <div className="result-head">
                      <h3>
                        <i className="fa-regular fa-file-pdf" /> PDF Cours
                      </h3>
                      <span className="pill">Support</span>
                    </div>

                    <div className="result-list">
                      {results.pdfCourses.length === 0 ? (
                        <p className="muted">Lance une recherche pour afficher des PDFs…</p>
                      ) : (
                        results.pdfCourses.map((p, idx) => (
                          <div className="result-item" key={`pc-${idx}`}>
                            <div className="meta">
                              <div className="title">{p.title}</div>
                              <div className="sub">{p.sub}</div>
                              {p.snippet && <div className="sub">{p.snippet}</div>}
                            </div>

                            <div className="action">
                              {p.url ? (
                                <a className="btn btn-outlinee1" href={p.url} target="_blank" rel="noreferrer">
                                  Ouvrir / Télécharger
                                </a>
                              ) : (
                                <button className="btn btn-outline" type="button" disabled>
                                  Ouvrir
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="card result-card">
                    <div className="result-head">
                      <h3>
                        <i className="fa-solid fa-pen-to-square" /> Exercices + corrigés
                      </h3>
                      <span className="pill">Pratique</span>
                    </div>

                    <div className="result-list">
                      {results.pdfExos.length === 0 ? (
                        <p className="muted">Lance une recherche pour afficher des exercices…</p>
                      ) : (
                        results.pdfExos.map((p, idx) => (
                          <div className="result-item" key={`pe-${idx}`}>
                            <div className="meta">
                              <div className="title">{p.title}</div>
                              <div className="sub">{p.sub}</div>
                              {p.snippet && <div className="sub">{p.snippet}</div>}
                            </div>

                            <div className="action">
                              {p.url ? (
                                <a className="btn btn-outlinee1" href={p.url} target="_blank" rel="noreferrer">
                                  Ouvrir / Télécharger
                                </a>
                              ) : (
                                <button className="btn btn-outline" type="button" disabled>
                                  Ouvrir
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="card result-card">
                    <div className="result-head">
                      <h3>
                        <i className="fa-solid fa-circle-question" /> Quiz
                      </h3>
                     <button
  className="pilleee"
  type="button"
  onClick={() => window.open("https://wordestool.online/subjects/", "_blank")}
>
  Evaluation
</button>
                    </div>

                    <div className="quiz-box">
                      {!results.quiz ? (
                        <p className="muted">Lance une recherche pour générer un quiz…</p>
                      ) : (
                        <>
                          <div className="meta" style={{ marginBottom: ".8rem" }}>
                            <div className="title">{results.quiz.title}</div>
                            <div className="sub">{results.quiz.sub}</div>
                          </div>
                          <button className="btn btn-primary" type="button">
                            Démarrer le quiz
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INPERSON TAB (NOUVEAU FLOW) */}
            {activeTab === "inperson-tab" && (
              <div id="inperson-tab" className="tab-content active">
                <div className="card">
                  <div className="result-head" style={{ marginBottom: "1rem" }}>
                    <button
                className={`tab-btn ${activeTab === "learn-tab" ? "active" : ""}`}
                type="button"
                onClick={() => setActiveView("dashboard")}
              >
               Apprendre
              </button>
                    <span className="pill pill-green">
                      {inPersonCity ? `Ville: ${inPersonCity}` : "Choisir une ville"}
                    </span>
                  </div>
  

             
                  {/* STEP 1: CITY */}
                  {inPersonStep === "city" && (
                    <>
                      <p className="muted" style={{ marginBottom: "1rem" }}>
                        Sélectionne ta ville (4 villes disponibles).
                      </p>

                      <div key={cityAnimKey} className="city-grid animate-in">
                        {INPERSON_CITIES.map((c) => (
                          <div key={c.name} className="city-card">
                            <div className="city-img">
                              <img src={c.img} alt={c.name} />
                            </div>

                            <div className="city-body">
                              <h4>{c.name}</h4>
                              <p>{c.desc}</p>

                              <button
                                className="btn btn-primary"
                                type="button"
                                onClick={() => {
                                  setInPersonCity(c.name);
                                  setInPersonSubject("");
                                  setInPersonStep("subject");
                                  setResults((p) => ({ ...p, inPerson: [] }));
                                }}
                              >
                                En savoir plus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* STEP 2: SUBJECT */}
                  {inPersonStep === "subject" && (
                    <>
                      <div className="step-bar">
                        <button className="btn btn-outline" type="button" onClick={() => setInPersonStep("city")}>
                          ← Changer de ville
                        </button>

                        <div className="step-info">
                          <div className="title">Ville sélectionnée : {inPersonCity}</div>
                          <div className="sub">Choisis maintenant la matière</div>
                        </div>
                      </div>

                      <div className="subject-row">
                        <select
                          className="input-field"
                          value={inPersonSubject}
                          onChange={(e) => setInPersonSubject(e.target.value)}
                        >
                          <option value="" disabled>
                            Sélectionner une matière…
                          </option>

                          {INPERSON_SUBJECTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={!inPersonSubject || inPersonLoading}
                          onClick={searchInPerson}
                        >
                          {inPersonLoading ? "Recherche..." : "Trouver des profs"}
                        </button>
                      </div>

                      <div className="mini-hint">💡 Le résultat sera filtré par ville + matière.</div>
                    </>
                  )}

                 
                  {/* STEP 3: RESULTS */}
                  {inPersonStep === "results" && (
                    <>
                      <div className="step-bar">
                        <button className="btn btn-outline" type="button" onClick={() => setInPersonStep("subject")}>
                          ← Modifier matière
                        </button>

                        <div className="step-info">
                          <div className="title">
                            {inPersonCity} • {inPersonSubject}
                          </div>
                          <div className="sub">Résultats disponibles</div>
                        </div>
                      </div>

                      <div className="result-list">
                        {results.inPerson.length === 0 ? (
                          <p className="muted">Aucun résultat pour le moment.</p>
                        ) : (
                          results.inPerson.map((p, idx) => (
                            <div className="result-item" key={`ip-${idx}`}>
                              <div className="meta" style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                                {/* ✅ photo */}
                                <div
                                  style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: 14,
                                    overflow: "hidden",
                                    flex: "0 0 auto",
                                    background: "rgba(255,255,255,0.06)",
                                  }}
                                >
                                  {p.imageUrl ? (
                                    <img
                                      src={p.imageUrl}
                                      alt={p.name}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      onError={(e) => {
                                        // si l’image est bloquée/404 → on l’enlève
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "grid",
                                        placeItems: "center",
                                        fontSize: 18,
                                        opacity: 0.7,
                                      }}
                                    >
                                      <i className="fa-regular fa-user" />
                                    </div>
                                  )}
                                </div>

                                {/* ✅ texte */}
                                <div>
                                  <div className="title">{p.name}</div>
                                  <div className="sub">{p.address}</div>
                                </div>
                              </div>


                              {/* ✅ ACTIONS (PRO) */}
                              <div className="action" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>

                                {/* ✅ NOUVEAU: Ouvrir profil (lien source) */}
                                {p.url ? (
                                  <a className="btn btn-primary" href={p.url} target="_blank" rel="noreferrer">
                                    Ouvrir profil
                                  </a>
                                ) : (
                                  <button className="btn btn-primary" type="button" disabled>
                                    Ouvrir profil
                                  </button>
                                )}

                                {/* ✅ NOUVEAU: Itinéraire (sans Places API) */}
                                {p.mapsUrl ? (
                                  <a className="btn btn-outline" href={p.mapsUrl} target="_blank" rel="noreferrer">
                                    Itinéraire
                                  </a>
                                ) : (
                                  <button className="btn btn-outline" type="button" disabled>
                                    Itinéraire
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}







