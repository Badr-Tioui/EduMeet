// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  numeroEtudiant: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  telephone: {
    type: String,
    default: "",
  },
  dateNaissance: {
    type: Date,
    default: "2000-01-01",
  },
  filiere: {
    type: String,
    default: "informatique",
  },
  niveau: {
    type: String,
    default: "licence1",
  },
  role: {
    type: String,
    enum: ["etudiant", "professeur", "admin"],
    default: "etudiant",
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // plus de next
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Vérification du mot de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
