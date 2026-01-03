// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require('dotenv').config();


console.log("EMAIL USER =", process.env.EMAIL_USER);
console.log("EMAIL PASS =", process.env.EMAIL_PASS ? "OK" : "VIDE");

const app = express();

// 🔹 Configuration du PORT
const PORT = process.env.PORT || 5000;

// 🔹 Connexion MongoDB

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/edumeet";

    const conn = await mongoose.connect(mongoURI); // plus d'options ici

    console.log(`MongoDB connecté ✅ : ${conn.connection.host}`);
  } catch (error) {
    console.error("Erreur de connexion à MongoDB:", error.message);
    process.exit(1);
  }
};

connectDB();

// 🔹 Middleware
app.use(cors()); // Permet l'accès depuis React
app.use(express.json()); // Permet de parser les JSON
app.use(express.urlencoded({ extended: true })); // Pour formulaires HTML

// Dossier public pour fichiers statiques (ex: images, HTML)
app.use(express.static(path.join(__dirname, "public")));

//  Routes
const EtudRoute = require("./src/routes/EtudRoute");
app.use("/api/auth", EtudRoute);


//  Route de test

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "RegisterEtud.html"));
});


// 🔹 Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
