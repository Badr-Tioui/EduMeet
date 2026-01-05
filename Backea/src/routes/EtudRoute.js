// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../Controller/EtudController");

// === Routes inscription / récupération ===

// Inscription étudiant
router.post("/register/etudiant", authController.registerEtudiant);


// === LOGIN (même base /api/auth) ===
router.post("/login", authController.login);


router.post("/send-verification-email", authController.sendVerificationEmail);


router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);


// Récupérer tous les étudiants inscrits
router.get("/etudiants", authController.getAllEtudiants);

module.exports = router;
