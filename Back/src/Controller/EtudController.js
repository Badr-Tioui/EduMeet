// controllers/authController.js
const User = require("../Models/EtudModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// === Inscription Etudiant ===
exports.registerEtudiant = async (req, res) => {
  try {
    const { nom, email, numeroEtudiant, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    // Hash du mot de passe
    //const salt = await bcrypt.genSalt(10);
    //const hashedPassword = await bcrypt.hash(password, salt);

    // Créer le nouvel utilisateur
    const newUser = new User({
      nom,
      email,
      numeroEtudiant,
      password,
      role: "etudiant", // forcer le rôle étudiant
    });

    await newUser.save();

    // Créer le token JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      token,
      data: {
        id: newUser._id,
        nom: newUser.nom,
      
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};



// === LOGIN ===
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Vérifier utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // 2. Vérifier mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // 3. Créer token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Réponse
    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        nom: user.nom,
     
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};



// === Récupérer tous les étudiants inscrits ===
exports.getAllEtudiants = async (req, res) => {
  try {
    const etudiants = await User.find({ role: "etudiant" }).select(
      "-password" // On ne renvoie jamais le mot de passe
    );

    res.status(200).json({
      success: true,
      count: etudiants.length,
      data: etudiants,
    });
  } catch (error) {
    console.error("Erreur getAllEtudiants:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};
