const Need = require("../models/Need");

// POST /api/needs
exports.createNeed = async (req, res) => {
  const { title, topic, level, keywords } = req.body;

  if (!title || !topic) {
    return res.status(400).json({ message: "title et topic sont obligatoires" });
  }

  const need = await Need.create({
    title,
    topic,
    level: level || "debutant",
    keywords: Array.isArray(keywords) ? keywords : [],
    student: req.user.id,
  });

  return res.status(201).json(need);
};

// GET /api/needs/me
exports.getMyNeeds = async (req, res) => {
  const needs = await Need.find({ student: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return res.json(needs);
};

// GET /api/needs/:id
exports.getNeedById = async (req, res) => {
  const need = await Need.findById(req.params.id);

  if (!need) return res.status(404).json({ message: "Besoin introuvable" });

  // sécurité: l’étudiant ne voit que ses besoins
  if (need.student.toString() !== req.user.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  return res.json(need);
};

// PATCH /api/needs/:id
exports.updateNeed = async (req, res) => {
  const allowed = ["title", "topic", "level", "keywords", "status"];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const need = await Need.findById(req.params.id);
  if (!need) return res.status(404).json({ message: "Besoin introuvable" });

  if (need.student.toString() !== req.user.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  Object.assign(need, updates);
  await need.save();

  return res.json(need);
};

// DELETE /api/needs/:id
exports.deleteNeed = async (req, res) => {
  const need = await Need.findById(req.params.id);
  if (!need) return res.status(404).json({ message: "Besoin introuvable" });

  if (need.student.toString() !== req.user.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  await need.deleteOne();
  return res.json({ message: "Besoin supprimé" });
};
