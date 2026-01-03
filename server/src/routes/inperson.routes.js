const router = require("express").Router();
const { inpersonSearch } = require("../controllers/inperson.controller");

router.post("/", inpersonSearch);

module.exports = router;
