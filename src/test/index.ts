import * as assert from "assert"
import {ipcRenderer} from "electron"
require("mocha/mocha.css")
require("mocha/mocha")

mocha.setup("bdd")

describe("mocha", () => {
  it("runs", () => {
    assert(true)
  })
  it("fails", () => {
    assert(false)
  })
})

mocha.run(failCount => {
  ipcRenderer.send("testDone", failCount)
})
