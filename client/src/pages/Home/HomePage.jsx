import { useEffect } from "react";
import "./HomePage.css";

export default function HomePage() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ===== Reveal on scroll =====
    const revealOnScroll = () => {
      const items = document.querySelectorAll(".reveal");
      if (!items.length) return;

      if (prefersReduced) {
        items.forEach((el) => el.classList.add("in"));
        return;
      }

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.12 }
      );

      items.forEach((el, idx) => {
        el.style.transitionDelay = `${Math.min(idx * 25, 180)}ms`;
        io.observe(el);
      });

      return () => io.disconnect();
    };

    // ===== Counters =====
    const countersOnView = () => {
      const counters = document.querySelectorAll(".count");
      if (!counters.length) return;

      if (prefersReduced) {
        counters.forEach((c) => (c.textContent = c.dataset.to || "0"));
        return;
      }

      const animateCounter = (el) => {
        const to = Number(el.dataset.to || 0);
        const duration = 900;
        const t0 = performance.now();

        const tick = (t) => {
          const p = Math.min((t - t0) / duration, 1);
          const value = Math.round(to * (1 - Math.pow(1 - p, 3)));
          el.textContent = String(value);
          if (p < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      };

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.35 }
      );

      counters.forEach((c) => io.observe(c));
      return () => io.disconnect();
    };

    // ===== Navbar blur =====
    const navbarOnScroll = () => {
      const nav = document.querySelector(".nav");
      if (!nav) return;

      const onScroll = () => {
        if (window.scrollY > 8) nav.classList.add("scrolled");
        else nav.classList.remove("scrolled");
      };

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    };

    // ===== Parallax halos =====
    const parallaxHalos = () => {
      if (prefersReduced) return;

      const h1 = document.querySelector(".halo-1");
      const h2 = document.querySelector(".halo-2");
      const h3 = document.querySelector(".halo-3");
      if (!h1 || !h2 || !h3) return;

      let ticking = false;

      const update = () => {
        ticking = false;
        const y = window.scrollY || 0;
        h1.style.transform = `translate3d(0, ${y * 0.04}px, 0)`;
        h2.style.transform = `translate3d(0, ${y * 0.06}px, 0)`;
        h3.style.transform = `translate3d(0, ${y * 0.03}px, 0)`;
      };

      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      update();

      return () => window.removeEventListener("scroll", onScroll);
    };

    // ===== Mobile drawer =====
    const mobileDrawer = () => {
      const btn = document.getElementById("burgerBtn");
      const drawer = document.getElementById("drawer");
      if (!btn || !drawer) return;

      const close = () => drawer.classList.remove("open");

      const onBtn = () => drawer.classList.toggle("open");
      const onDrawerClick = (e) => {
        const a = e.target.closest("a");
        if (a) close();
      };
      const onDocClick = (e) => {
        if (!drawer.classList.contains("open")) return;
        const inside =
          e.target.closest(".drawer") || e.target.closest("#burgerBtn");
        if (!inside) close();
      };

      btn.addEventListener("click", onBtn);
      drawer.addEventListener("click", onDrawerClick);
      document.addEventListener("click", onDocClick);

      return () => {
        btn.removeEventListener("click", onBtn);
        drawer.removeEventListener("click", onDrawerClick);
        document.removeEventListener("click", onDocClick);
      };
    };

    const cleanups = [];
    const c1 = revealOnScroll();
    if (typeof c1 === "function") cleanups.push(c1);
    const c2 = countersOnView();
    if (typeof c2 === "function") cleanups.push(c2);
    const c3 = navbarOnScroll();
    if (typeof c3 === "function") cleanups.push(c3);
    const c4 = parallaxHalos();
    if (typeof c4 === "function") cleanups.push(c4);
    const c5 = mobileDrawer();
    if (typeof c5 === "function") cleanups.push(c5);

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <>
      {/* Background halos */}
      <div className="bg-halos" aria-hidden="true">
        <span className="halo halo-1" />
        <span className="halo halo-2" />
        <span className="halo halo-3" />
      </div>

      {/* Navbar */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <i className="fa-solid fa-graduation-cap" />
            <span>EduMeet</span>
          </div>

          <nav className="nav-links">
            <a href="#features">Fonctionnalités</a>
            <a href="#how">Comment ça marche</a>
            <a href="#analytics">Analytics</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav-actions">
            <a className="btn btn-outline" href="/student">
              Connexion
            </a>
            <a className="btn btn-primary" href="/student">
              S’inscrire
            </a>

            <button className="burger" id="burgerBtn" aria-label="Menu">
              <i className="fa-solid fa-bars" />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className="drawer" id="drawer">
          <a href="#features">Fonctionnalités</a>
          <a href="#how">Comment ça marche</a>
          <a href="#analytics">Analytics</a>
          <a href="#faq">FAQ</a>
          <div className="drawer-actions">
            <a className="btn btn-outline" href="/student">
              Connexion
            </a>
            <a className="btn btn-primary" href="/student">
              S’inscrire
            </a>
          </div>
        </div>
      </header>

      {/* CONTENT (NO <body>, NO <script>, NO HTML comments) */}
      <main>
        {/* Hero */}
        <section className="hero section">
          <div className="hero-grid">
            <div className="hero-left">
              <div className="chip reveal">
                <i className="fa-solid fa-bolt" />
                <span>Apprentissage intelligent + Présentiel</span>
              </div>

              <h1 className="reveal">
                Apprends <span className="gradient-text">n’importe quel sujet</span>
                <br />
                et trouve un <span className="gradient-text">centre</span> près de
                toi.
              </h1>

              <p className="hero-sub reveal">
                EduMeet génère automatiquement un pack d’étude : vidéos, PDF,
                exercices corrigés et quiz, et t’aide à réserver des séances de
                soutien en présentiel.
              </p>

              <div className="hero-cta reveal">
                <a className="btn btn-primary" href="/student">
                  <i className="fa-solid fa-wand-magic-sparkles" /> Démarrer
                  maintenant
                </a>
                <a className="btn btn-outline" href="#how">
                  <i className="fa-regular fa-circle-play" /> Voir comment ça
                  marche
                </a>
              </div>

              <div className="hero-metrics reveal">
                <div className="metric">
                  <div className="metric-value">
                    <span className="count" data-to="3">
                      0
                    </span>
                    +
                  </div>
                  <div className="metric-label">Types de ressources</div>
                </div>
                <div className="metric">
                  <div className="metric-value">
                    <span className="count" data-to="10">
                      0
                    </span>{" "}
                    min
                  </div>
                  <div className="metric-label">pour un pack</div>
                </div>
                <div className="metric">
                  <div className="metric-value">
                    <span className="count" data-to="100">
                      0
                    </span>
                    %
                  </div>
                  <div className="metric-label">personnalisé</div>
                </div>
              </div>
            </div>

            {/* Right mockup */}
            <div className="hero-right reveal">
              <div className="mock">
                <div className="mock-top">
                  <div className="dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="mock-title">EduMeet — Dashboard</div>
                </div>

                <div className="mock-body">
                  <div className="mock-card hero-card">
                    <div className="mock-card-head">
                      <div className="mock-h">
                        <i className="fa-solid fa-location-dot" /> Centre recommandé
                        près de toi
                      </div>
                      <span className="pill">Présentiel</span>
                    </div>

                    <div className="mock-h2">Mathématiques — Intégrales</div>
                    <div className="mock-muted">Centre Atlas Support • Fès</div>
                    <div className="mock-muted" style={{ marginTop: ".25rem" }}>
                      <i className="fa-solid fa-route" /> ~2.1 km • Ouvert
                      aujourd’hui
                    </div>

                    <div className="mock-actions">
                      <button className="mini-btn" type="button">
                        <i className="fa-solid fa-location-dot" /> Localisation
                      </button>
                      <button className="mini-btn secondary" type="button">
                        <i className="fa-solid fa-route" /> Itinéraire
                      </button>
                    </div>
                  </div>

                  <div className="mock-split">
                    <div className="mock-card">
                      <div className="mock-card-head">
                        <div className="mock-h">Pack d’étude</div>
                        <span className="pill pill-green">Auto</span>
                      </div>
                      <ul className="mini-list">
                        <li>
                          <i className="fa-brands fa-youtube" /> Vidéos
                        </li>
                        <li>
                          <i className="fa-regular fa-file-pdf" /> PDF
                        </li>
                        <li>
                          <i className="fa-solid fa-pen-to-square" /> Exercices
                        </li>
                        <li>
                          <i className="fa-solid fa-circle-question" /> Quiz
                        </li>
                      </ul>
                    </div>

                    <div className="mock-card">
                      <div className="mock-card-head">
                        <div className="mock-h">Progression</div>
                        <span className="pill">Analytics</span>
                      </div>
                      <div className="mini-progress">
                        <div className="bar">
                          <span style={{ width: "72%" }} />
                        </div>
                        <div className="mock-muted">Score moyen quiz : 72%</div>
                        <div className="mock-muted">Streak : 4 jours</div>
                      </div>
                    </div>
                  </div>

                  <div className="mock-footer">
                    <span className="hint">
                      💡 Tape un sujet : “pointeurs C++”, “SQL JOIN”, “Intégrales”...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="scroll-hint reveal">
            <span>Scroll</span>
            <i className="fa-solid fa-arrow-down" />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="reveal">Ce que EduMeet fait pour toi</h2>
              <p className="reveal muted">
                Une plateforme “tout-en-un” : apprentissage autonome + soutien en
                présentiel + analytics.
              </p>
            </div>

            <div className="features-grid">
              <article className="feature-card reveal">
                <div className="icon">
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </div>
                <h3>Packs d’étude automatiques</h3>
                <p>
                  Tu écris n’importe quel sujet. EduMeet te propose des vidéos,
                  PDF, exercices corrigés et un quiz.
                </p>
              </article>

              <article className="feature-card reveal">
                <div className="icon green">
                  <i className="fa-solid fa-location-dot" />
                </div>
                <h3>Présentiel près de toi</h3>
                <p>
                  Recherche de centres de soutien et profs en présentiel, avec
                  infos pratiques et itinéraire.
                </p>
              </article>

              <article className="feature-card reveal">
                <div className="icon">
                  <i className="fa-solid fa-chart-line" />
                </div>
                <h3>Analytics & progression</h3>
                <p>
                  Score quiz, streak, objectifs du jour, temps d’étude, et
                  recommandations personnalisées.
                </p>
              </article>

              <article className="feature-card reveal">
                <div className="icon">
                  <i className="fa-solid fa-shield-halved" />
                </div>
                <h3>Contenu fiable</h3>
                <p>
                  Un workflow clair : supports, exercices, évaluation. L’étudiant
                  garde un historique de packs.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="reveal">Comment ça marche</h2>
              <p className="reveal muted">
                Un parcours simple, efficace, et très “product”.
              </p>
            </div>

            <div className="steps">
              <div className="step reveal">
                <div className="step-n">1</div>
                <div className="step-body">
                  <h3>Tu saisis ton besoin</h3>
                  <p>
                    Ex : “pointeurs C++”, “Intégrales”, “TCP/IP”, “SQL JOIN”, ou
                    n’importe quel sujet.
                  </p>
                </div>
              </div>

              <div className="step reveal">
                <div className="step-n">2</div>
                <div className="step-body">
                  <h3>EduMeet prépare ton pack</h3>
                  <p>
                    Vidéos + PDF cours + PDF exercices corrigés + quiz pour
                    évaluer ton niveau.
                  </p>
                </div>
              </div>

              <div className="step reveal">
                <div className="step-n">3</div>
                <div className="step-body">
                  <h3>Tu peux aussi passer au présentiel</h3>
                  <p>
                    Trouve un centre de soutien, compare, et vois l’itinéraire
                    pour une séance face à face.
                  </p>
                </div>
              </div>

              <div className="step reveal">
                <div className="step-n">4</div>
                <div className="step-body">
                  <h3>Analytics & amélioration continue</h3>
                  <p>
                    Ton tableau de bord suit ta progression et te propose des
                    objectifs quotidiens.
                  </p>
                </div>
              </div>
            </div>

            <div className="cta-card reveal">
              <div>
                <h3>Prêt à tester un pack sur ton prochain cours ?</h3>
                <p className="muted">
                  Tu peux démarrer immédiatement et construire ton historique
                  d’apprentissage.
                </p>
              </div>
              <a className="btn btn-primary" href="/student">
                <i className="fa-solid fa-bolt" /> Lancer EduMeet
              </a>
            </div>
          </div>
        </section>

        {/* Analytics */}
        <section id="analytics" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="reveal">Analytics qui motivent (sans te fatiguer)</h2>
              <p className="reveal muted">
                Des indicateurs simples, actionnables, et orientés résultat.
              </p>
            </div>

            <div className="analytics-grid">
              <div className="glass-card reveal">
                <div className="glass-title">
                  <i className="fa-solid fa-gauge-high" /> Score moyen
                </div>
                <div className="glass-value">
                  <span className="count" data-to="72">
                    0
                  </span>
                  %
                </div>
                <div className="muted">Moyenne sur les quiz</div>
              </div>

              <div className="glass-card reveal">
                <div className="glass-title">
                  <i className="fa-solid fa-fire" /> Streak
                </div>
                <div className="glass-value">
                  <span className="count" data-to="4">
                    0
                  </span>{" "}
                  jours
                </div>
                <div className="muted">Consistance d’étude</div>
              </div>

              <div className="glass-card reveal">
                <div className="glass-title">
                  <i className="fa-solid fa-bullseye" /> Objectif
                </div>
                <div className="glass-value">
                  <span className="count" data-to="1">
                    0
                  </span>{" "}
                  pack/j
                </div>
                <div className="muted">Rythme recommandé</div>
              </div>

              <div className="glass-card reveal">
                <div className="glass-title">
                  <i className="fa-solid fa-clock" /> Temps
                </div>
                <div className="glass-value">
                  <span className="count" data-to="45">
                    0
                  </span>{" "}
                  min
                </div>
                <div className="muted">Focus quotidien</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="reveal">FAQ</h2>
              <p className="reveal muted">
                Les questions qu’on te posera en soutenance 👀
              </p>
            </div>

            <div className="faq">
              <details className="faq-item reveal">
                <summary>Est-ce que je peux chercher n’importe quel sujet ?</summary>
                <p>
                  Oui. Tu écris ton sujet, EduMeet te propose un pack d’apprentissage
                  (vidéos + PDF + exercices + quiz).
                </p>
              </details>

              <details className="faq-item reveal">
                <summary>Le présentiel, c’est quoi exactement ?</summary>
                <p>
                  Une recherche de centres/profs pour du soutien en personne, avec
                  infos pratiques (distance, itinéraire).
                </p>
              </details>

              <details className="faq-item reveal">
                <summary>Qu’est-ce qui rend la plateforme “intelligente” ?</summary>
                <p>
                  La logique : génération de pack, suivi d’activité, quiz, analytics et
                  objectifs adaptés au comportement de l’étudiant.
                </p>
              </details>
            </div>

            <footer className="footer reveal">
              <div className="footer-left">
                <div className="brand small">
                  <i className="fa-solid fa-graduation-cap" />
                  <span>EduMeet</span>
                </div>
                <p className="muted">
                  Plateforme d’apprentissage autonome + présentiel + analytics.
                </p>
              </div>
              <div className="footer-right">
                <a href="#features">Fonctionnalités</a>
                <a href="#how">Comment ça marche</a>
                <a href="#analytics">Analytics</a>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
