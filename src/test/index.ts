import {ipcRenderer} from "electron"
require("mocha/mocha.css")
require("mocha/mocha")
require('stack-source-map')()

mocha.setup("bdd")

require("./models/PictureTest")
require("./models/LayerTest")
require("./services/PictureExportTest")

mocha.run(failCount => {
  ipcRenderer.send("testDone", failCount)
})
