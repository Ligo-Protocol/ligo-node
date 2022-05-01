var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req: any, res: any) {
  res.send("respond with a resource");
});

module.exports = router;
