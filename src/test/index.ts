import * as assert from "assert"
require("mocha/mocha.css")
require("mocha/mocha")

mocha.setup("bdd")

describe("mocha", () => {
  it("runs", () => {
    assert(true)
  })
})

mocha.run()
