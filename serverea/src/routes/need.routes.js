const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const controller = require("../controllers/need.controller");

if (process.env.DEV_NO_AUTH !== "true") {
  router.use(auth);
}


router.post("/", controller.createNeed);
router.get("/me", controller.getMyNeeds);
router.get("/:id", controller.getNeedById);
router.patch("/:id", controller.updateNeed);
router.delete("/:id", controller.deleteNeed);

module.exports = router;
