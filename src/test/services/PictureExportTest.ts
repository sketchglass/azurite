import * as path from "path"
import * as assert from "power-assert"
import {Vec2} from "paintvec"
import {Color} from "paintgl"
import Picture from "../../renderer/models/Picture"
import {ImageLayer} from "../../renderer/models/Layer"
import {PictureExport} from "../../renderer/services/PictureExport"
import {appState} from "../../renderer/state/AppState"
import {remote} from "electron"

const tempPath = remote.app.getPath("temp")

describe("PictureExport", () => {
  describe("import/export", () => {
    it("imports/exports image", async () => {
      const canvas = document.createElement("canvas")
      canvas.width = 100
      canvas.height = 200
      const context = canvas.getContext("2d")!
      // TODO: test with transparency
      context.fillStyle = "red"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = "blue"
      context.fillRect(10, 20, 30, 40)

      const picture1 = new Picture({width: 1000, height: 2000, dpi: 72})

      const layer = new ImageLayer(picture1, {name: "Layer"})
      layer.tiledTexture.putImage(new Vec2(), canvas)

      picture1.rootLayer.children.push(layer)

      const filePath = path.join(tempPath, "test-export.png")

      const pictureExport1 = new PictureExport(picture1)
      const format = appState.imageFormats.find(f => f.extensions.includes("png"))!
      await pictureExport1.export(filePath, format)
      pictureExport1.dispose()

      const picture2 = new Picture({width: 1000, height: 2000, dpi: 72})
      const pictureExport2 = new PictureExport(picture2)
      await pictureExport2.import([filePath])
      pictureExport2.dispose()

      const children2 = picture2.rootLayer.children
      assert(children2.length === 2)
      const layer2 = children2[0] as ImageLayer
      assert(layer2.name == "test-export")
      assert(layer2.tiledTexture.keys().length > 0)
      assert(layer2.tiledTexture.colorAt(new Vec2(5, 5)).equals(new Color(1, 0, 0, 1)))
      assert(layer2.tiledTexture.colorAt(new Vec2(15, 30)).equals(new Color(0, 0, 1, 1)))

      picture1.dispose()
      picture2.dispose()
    })
  })
})
