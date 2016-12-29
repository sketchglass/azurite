import {ipcRenderer} from "electron"
require("mocha/mocha.css")
require("mocha/mocha")

mocha.setup("bdd")

require("./models/PictureTest")

mocha.run(failCount => {
  ipcRenderer.send("testDone", failCount)
})
