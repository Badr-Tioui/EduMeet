const router = require("express").Router();
const controller = require("../controllers/search.controller");

// ✅ test GET (pour navigateur)
router.get("/", (req, res) => {
  res.json({ ok: true, hint: "Use POST /api/search with JSON body" });
});

// ✅ vrai endpoint
router.post("/", controller.searchAll);

module.exports = router;
