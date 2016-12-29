import * as assert from 'power-assert';
import Picture from "../../renderer/models/Picture"

describe("Picture", () => {
  let dimension = {width: 1000, height: 2000, dpi: 72}
  let picture: Picture
  beforeEach(() => {
    picture = new Picture(dimension)
  })

  describe("#size", () => {
    it("returns width and height of picture", () => {
      assert(picture.size.width == dimension.width)
      assert(picture.size.height == dimension.height)
    })
  })
})
