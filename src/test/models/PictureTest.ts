import * as assert from 'power-assert'
import Picture from '../../renderer/models/Picture'

describe('Picture', () => {
  let dimension = {width: 1000, height: 2000, dpi: 72}
  let picture: Picture
  beforeEach(() => {
    picture = new Picture(dimension)
  })

  describe('#size', () => {
    it('returns width and height of picture', () => {
      assert(picture.size.width === dimension.width)
      assert(picture.size.height === dimension.height)
    })
  })

  describe('#rect', () => {
    it('returns rwectangle with (0, 0) top-left and picture size', () => {
      assert(picture.rect.left === 0)
      assert(picture.rect.top === 0)
      assert(picture.rect.width === dimension.width)
      assert(picture.rect.height === dimension.height)
    })
  })

  describe('#fileName', () => {
    it('returns \'Untitled\' when filePath is not set', () => {
      assert(picture.fileName === 'Untitled')
    })
    it('returns basename of filePath', () => {
      picture.filePath = '/foo/bar/baz.azurite'
      assert(picture.fileName === 'baz.azurite')
    })
  })
})
