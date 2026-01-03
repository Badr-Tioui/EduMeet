const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email, password requis" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email déjà utilisé" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash });

  const token = signToken(user);
  return res.status(201).json({
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    token,
  });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email, password requis" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Identifiants invalides" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Identifiants invalides" });

  const token = signToken(user);
  return res.json({
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    token,
  });
};
