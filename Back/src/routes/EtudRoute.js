// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../Controller/EtudController");

// === Routes inscription / récupération ===

// Inscription étudiant
router.post("/register/etudiant", authController.registerEtudiant);


// === LOGIN (même base /api/auth) ===
router.post("/login", authController.login);

// Récupérer tous les étudiants inscrits
router.get("/etudiants", authController.getAllEtudiants);

module.exports = router;
