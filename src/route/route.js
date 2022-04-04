const express = require("express")
const router = express.Router()
const userController = require("../controller/userController")


router.post("/url",userController.urlMake)
router.get("/:urlCode",userController.getUrlcode)


module.exports = router;