import {remote} from 'electron'
import {Vec2} from 'paintvec'
import * as path from 'path'
import * as assert from 'power-assert'
import {formatRegistry} from '../../renderer/app/FormatRegistry'
import '../../renderer/formats/PictureFormatCanvasImage'
import {ImageLayer} from '../../renderer/models/Layer'
import Picture from '../../renderer/models/Picture'
import {PictureExport} from '../../renderer/services/PictureExport'
import TestPattern from '../util/TestPattern'

const tempPath = remote.app.getPath('temp')

describe('PictureExport', () => {
  describe('import/export', () => {
    it('imports/exports image', async () => {
      const testPattern = new TestPattern()

      const picture1 = new Picture({width: 1000, height: 2000, dpi: 72})

      const layer = new ImageLayer(picture1, {name: 'Layer'})
      layer.tiledTexture.putImage(new Vec2(), testPattern.canvas)

      picture1.rootLayer.children.push(layer)

      const filePath = path.join(tempPath, 'test-export.png')

      const pictureExport1 = new PictureExport(picture1)
      const format = formatRegistry.pictureFormatForExtension('png')!
      await pictureExport1.export(filePath, format)
      pictureExport1.dispose()

      const picture2 = new Picture({width: 1000, height: 2000, dpi: 72})
      const pictureExport2 = new PictureExport(picture2)
      await pictureExport2.import([filePath])
      pictureExport2.dispose()

      const children2 = picture2.rootLayer.children
      assert(children2.length === 1)
      const layer2 = children2[0] as ImageLayer
      assert(layer2.name === 'test-export')
      assert(layer2.tiledTexture.keys().length > 0)
      testPattern.assert(layer2.tiledTexture)

      picture1.dispose()
      picture2.dispose()
    })
  })
})
