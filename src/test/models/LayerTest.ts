import * as assert from 'power-assert'
import Picture from '../../renderer/models/Picture'
import Layer, {GroupLayer, ImageLayer} from '../../renderer/models/Layer'
import IndexPath from '../../lib/IndexPath'
import * as msgpack from 'msgpack-lite'

function createImageLayer(picture: Picture) {
  // TODO: set tiled texture data
  return new ImageLayer(picture, {
    name: 'Foobar',
    visible: false,
    blendMode: 'plus',
    opacity: 0.9,
    preserveOpacity: true,
    clippingGroup: true
  })
}

function createGroupLayer(picture: Picture, children: Layer[]) {
  return new GroupLayer(picture, {
    name: 'Nyan',
    visible: false,
    blendMode: 'multiply',
    opacity: 0.8,
    preserveOpacity: true,
    clippingGroup: true
  }, children)
}

function compareLayers(actual: Layer, expected: Layer) {
  assert(actual !== expected)
  assert(actual.constructor === expected.constructor)
  assert(actual.name === expected.name)
  assert(actual.visible === expected.visible)
  assert(actual.blendMode === expected.blendMode)
  assert(actual.opacity === expected.opacity)
  assert(actual.preserveOpacity === expected.preserveOpacity)
  assert(actual.clippingGroup === expected.clippingGroup)
  if (actual instanceof ImageLayer && expected instanceof ImageLayer) {
    assert(actual.tiledTexture !== expected.tiledTexture)
    assert.deepEqual(msgpack.encode(actual.tiledTexture.toData()), msgpack.encode(expected.tiledTexture.toData()))
  }
  if (actual instanceof GroupLayer && expected instanceof GroupLayer) {
    assert(actual.children.length === expected.children.length)
    for (let i = 0; i < actual.children.length; ++i) {
      compareLayers(actual.children[i], expected.children[i])
    }
  }
}

describe('ImageLayer', () => {
  let picture: Picture
  let layer: ImageLayer
  beforeEach(() => {
    picture = new Picture({width: 1000, height: 2000, dpi: 72})
    layer = createImageLayer(picture)
  })

  describe('constructor', () => {
    it('sets layer props correctly', () => {
      assert(layer.name === 'Foobar')
      assert(layer.visible === false)
      assert(layer.blendMode === 'plus')
      assert(layer.opacity === 0.9)
      assert(layer.preserveOpacity === true)
      assert(layer.clippingGroup === true)
    })
  })

  describe('clone', () => {
    it('clones layer', () => {
      const cloned = layer.clone()
      compareLayers(cloned, layer)
    })
  })

  describe('toData/fromData', () => {
    it('converts layer <-> data', () => {
      const data = layer.toData()
      const cloned = ImageLayer.fromData(picture, data)
      compareLayers(cloned, layer)
    })
  })
})

describe('GroupLayer', () => {
  let picture: Picture
  let layer: GroupLayer

  beforeEach(() => {
    picture = new Picture({width: 1000, height: 2000, dpi: 72})
    layer = createGroupLayer(picture, [
      createImageLayer(picture),
      createGroupLayer(picture, [
        createImageLayer(picture),
        createImageLayer(picture),
      ]),
      createImageLayer(picture),
    ])
  })

  describe('clone', () => {
    it('deep clones layer', () => {
      const cloned = layer.clone()
      compareLayers(layer, cloned)
    })
  })

  describe('toData/fromData', () => {
    it('convers layer <-> data', () => {
      const data = layer.toData()
      const cloned = GroupLayer.fromData(picture, data)
      compareLayers(layer, cloned)
    })
  })

  describe('forEachDescendant', () => {
    it('iterates descendant', () => {
      let layers: Layer[] = []
      layer.forEachDescendant(l => layers.push(l))
      assert.deepEqual(layers, [
        layer.children[0],
        layer.children[1],
        (layer.children[1] as GroupLayer).children[0],
        (layer.children[1] as GroupLayer).children[1],
        layer.children[2],
      ])
    })
  })
  describe('descendantFromPath', () => {
    it('finds describe from path', () => {
      assert(layer.descendantForPath(new IndexPath([])) === layer)
      assert(layer.descendantForPath(new IndexPath([0])) === layer.children[0])
      assert(layer.descendantForPath(new IndexPath([1, 1])) === (layer.children[1] as GroupLayer).children[1])
      assert(layer.descendantForPath(new IndexPath([2, 2, 3])) === undefined)
    })
  })
})