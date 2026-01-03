// src/Controller/EtudController.js
const User = require("../Models/EtudModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/mail"); // transporter Mailtrap

// === INSCRIPTION ÉTUDIANT ===
exports.registerEtudiant = async (req, res) => {
  try {
    const { nom, email, numeroEtudiant, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Cet email est déjà utilisé" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nom,
      email,
      numeroEtudiant,
      password: hashedPassword,
      role: "etudiant",
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      token,
      data: {
        id: newUser._id,
        nomComplet: newUser.nom,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// === LOGIN ===
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
if (!user) return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });

const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });

// Si tout est ok, créer token
const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

res.status(200).json({
  success: true,
  token,
  data: {
    id: user._id,
    nomComplet: user.nom,
    email: user.email,
    role: user.role,
  },
});

  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// === ENVOI EMAIL DE VÉRIFICATION ===
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Email non trouvé" });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    const url = `http://localhost:3000/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: '"EduMeet 👩‍🎓" <no-reply@edumeet.com>',
      to: email,
      subject: "Vérification de votre email EduMeet",
      html: `<p>Cliquez <a href="${url}">ici</a> pour vérifier votre compte.</p>`,
    });

    res.status(200).json({ success: true, message: "Email de vérification envoyé !" });
  } catch (error) {
    console.error("Erreur sendVerificationEmail:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// === FORGOT PASSWORD ===
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Aucun compte associé à cet email" });

    // 2. Générer token sécurisé
const resetToken = crypto.randomBytes(32).toString("hex");

// 3. Sauvegarder token + expiration (15 minutes)
user.resetPasswordToken = resetToken;
user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
await user.save();

// 🔹 Afficher le token dans la console pour test
console.log("Token de réinitialisation pour", email, ":", resetToken);

// 4. Lien frontend
const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;


   await transporter.sendMail({
  from: '"EduMeet – Support 👩‍🎓" <no-reply@edumeet.com>',
  to: user.email,
  subject: "Réinitialisation de votre mot de passe – EduMeet",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color:#2c3e50;">Bonjour ${user.nom},</h2>

      <p>
        Vous avez demandé la réinitialisation de votre mot de passe pour votre compte
        <strong>EduMeet</strong>.
      </p>

      <p>
        Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
      </p>

      <p style="text-align:center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="
             background-color:#1e90ff;
             color:#ffffff;
             padding:12px 20px;
             text-decoration:none;
             border-radius:5px;
             font-weight:bold;
           ">
          Réinitialiser mon mot de passe
        </a>
      </p>

      <p>
        ⏱ <strong>Ce lien est valable pendant 15 minutes.</strong>
      </p>

      <p>
        Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.
        Votre mot de passe restera inchangé.
      </p>

      <hr />

      <p style="font-size:12px; color:#777;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.<br/>
        © ${new Date().getFullYear()} EduMeet – Tous droits réservés
      </p>
    </div>
  `,
});


    res.status(200).json({ success: true, message: "Email de réinitialisation envoyé" });
  } catch (error) {
    console.error("Erreur forgotPassword:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};


// === RESET PASSWORD ===
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // 1️⃣ Vérifier que le token existe et n'est pas expiré
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    console.log("Utilisateur trouvé pour token :", user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }

    // 2️⃣ Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(password, salt);

    console.log("Nouveau hash :", newHashedPassword);

    // 3️⃣ Mettre à jour le mot de passe et supprimer token/expiration
    user.password = newHashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log("Mot de passe mis à jour dans la base ✅");

    res.status(200).json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });

  } catch (error) {
    console.error("Erreur resetPassword:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};


// === GET ALL ÉTUDIANTS ===
exports.getAllEtudiants = async (req, res) => {
  try {
    const etudiants = await User.find({ role: "etudiant" }).select("-password");

    res.status(200).json({
      success: true,
      count: etudiants.length,
      data: etudiants,
    });
  } catch (error) {
    console.error("Erreur getAllEtudiants:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
