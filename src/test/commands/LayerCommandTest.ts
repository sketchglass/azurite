import * as assert from 'power-assert'
import {Vec2} from "paintvec"
import {Color} from "paintgl"
import Picture from "../../renderer/models/Picture"
import {GroupLayer, ImageLayer} from "../../renderer/models/Layer"
import {
  MoveLayerCommand,
  CopyLayerCommand,
  GroupLayerCommand,
  MergeLayerCommand,
  AddLayerCommand,
  RemoveLayerCommand,
  ChangeLayerPropsCommand,
} from "../../renderer/commands/LayerCommand"
import IndexPath from "../../lib/IndexPath"

interface LayerInfo {
  name: string
  children?: LayerInfo[]
}

function assertLayerStructure(layer: GroupLayer, structure: LayerInfo[]) {
  assert(layer.children.length == structure.length)
  for (let i = 0; i < structure.length; ++i) {
    const child = layer.children[i]
    const info = structure[i]
    assert(child.name == info.name)
    if (info.children) {
      assert(child instanceof GroupLayer)
      assertLayerStructure(child as GroupLayer, info.children)
    }
  }
}

describe("Layer commands", () => {

  let picture: Picture
  let originalStructure: LayerInfo[]
  beforeEach(() => {
    picture = new Picture({width: 1000, height: 2000, dpi: 72})
    const layers = [
      new ImageLayer(picture, {name: "1"}),
      new GroupLayer(picture, {name: "2"}, [
        new ImageLayer(picture, {name: "3"}),
        new GroupLayer(picture, {name: "4"}, [
          new ImageLayer(picture, {name: "5"}),
          new ImageLayer(picture, {name: "6"}),
        ]),
        new ImageLayer(picture, {name: "7"}),
      ]),
      new ImageLayer(picture, {name: "8"}),
    ]
    picture.layers.replace(layers)
    originalStructure = [
      {name: "1"},
      {name: "2", children: [
        {name: "3"},
        {name: "4", children: [
          {name: "5"},
          {name: "6"}
        ]},
        {name: "7"},
      ]},
      {name: "8"}
    ]
    return picture
  })

  describe("MoveLayerCommand", () => {
    let command: MoveLayerCommand
    beforeEach(() => {
      command = new MoveLayerCommand(
        picture,
        [new IndexPath([1, 0]), new IndexPath([1, 1, 0])],
        new IndexPath([1, 2])
      )
    })

    describe("redo", () => {
      it("moves layers", () => {
        picture.undoStack.redoAndPush(command)
        assertLayerStructure(picture.rootLayer, [
          {name: "1"},
          {name: "2", children: [
            {name: "4", children: [
              {name: "6"}
            ]},
            {name: "3"},
            {name: "5"},
            {name: "7"},
          ]},
          {name: "8"}
        ])
      })
    })

    describe("undo", () => {
      it("restores structure", () => {
        picture.undoStack.redoAndPush(command)
        picture.undoStack.undo()
        assertLayerStructure(picture.rootLayer, originalStructure)
      })
    })
  })

  describe("CopyLayerCommand", () => {
    let command: CopyLayerCommand
    beforeEach(() => {
      command = new CopyLayerCommand(
        picture,
        [new IndexPath([1, 0]), new IndexPath([1, 1, 0])],
        new IndexPath([1, 2])
      )
    })

    describe("redo", () => {
      it("copies layers", () => {
        picture.undoStack.redoAndPush(command)
        assertLayerStructure(picture.rootLayer, [
          {name: "1"},
          {name: "2", children: [
            {name: "3"},
            {name: "4", children: [
              {name: "5"},
              {name: "6"}
            ]},
            {name: "3"},
            {name: "5"},
            {name: "7"},
          ]},
          {name: "8"}
        ])
      })
    })

    describe("undo", () => {
      it("restores structure", () => {
        picture.undoStack.redoAndPush(command)
        picture.undoStack.undo()
        assertLayerStructure(picture.rootLayer, originalStructure)
      })
    })
  })


  describe("GroupLayerCommand", () => {
    let command: GroupLayerCommand
    beforeEach(() => {
      command = new GroupLayerCommand(
        picture,
        [new IndexPath([1, 0]), new IndexPath([1, 1, 0])],
      )
    })

    describe("redo", () => {
      it("groups layers", () => {
        picture.undoStack.redoAndPush(command)
        assertLayerStructure(picture.rootLayer, [
          {name: "1"},
          {name: "2", children: [
            {name: "Group", children: [
              {name: "3"},
              {name: "5"},
            ]},
            {name: "4", children: [
              {name: "6"}
            ]},
            {name: "7"},
          ]},
          {name: "8"}
        ])
      })
    })

    describe("undo", () => {
      it("restores structure", () => {
        picture.undoStack.redoAndPush(command)
        picture.undoStack.undo()
        assertLayerStructure(picture.rootLayer, originalStructure)
      })
    })
  })

  describe("MergeLayerCommand", () => {
    let command: MergeLayerCommand
    describe("when merging a group", () => {
      beforeEach(() => {
        const paths = [new IndexPath([1, 1])]
        command = new MergeLayerCommand(picture, paths)
        const layer1 = picture.layerForPath(paths[0]) as ImageLayer
        layer1.opacity = 0.9
      })
      it("preserves properties of group", () => {
        picture.undoStack.redoAndPush(command)
        assertLayerStructure(picture.rootLayer, [
          {name: "1"},
          {name: "2", children: [
            {name: "3"},
            {name: "4"},
            {name: "7"},
          ]},
          {name: "8"}
        ])
        const merged = picture.layerForPath(new IndexPath([1, 1])) as ImageLayer
        assert(merged instanceof ImageLayer)
        assert(merged.opacity == 0.9)
      })
    })
    describe("when merging layers", () => {
      beforeEach(() => {
        const paths = [new IndexPath([1, 0]), new IndexPath([1, 1, 0])]
        command = new MergeLayerCommand(picture, paths)
        const layer1 = picture.layerForPath(paths[0]) as ImageLayer
        const layer2 = picture.layerForPath(paths[1]) as ImageLayer

        const canvas = document.createElement("canvas")
        canvas.width = 100
        canvas.height = 200
        const context = canvas.getContext("2d")!
        context.fillStyle = "red"
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = "blue"
        context.fillRect(10, 20, 30, 40)

        layer1.tiledTexture.putImage(new Vec2(), canvas)
        layer2.tiledTexture.putImage(new Vec2(500, 500), canvas)
      })

      describe("redo", () => {
        it("merges layers", () => {
          picture.undoStack.redoAndPush(command)
          assertLayerStructure(picture.rootLayer, [
            {name: "1"},
            {name: "2", children: [
              {name: "Merged"},
              {name: "4", children: [
                {name: "6"}
              ]},
              {name: "7"},
            ]},
            {name: "8"}
          ])
          const merged = picture.layerForPath(new IndexPath([1, 0])) as ImageLayer
          assert.deepEqual(merged.tiledTexture.colorAt(new Vec2(5, 5)), new Color(1, 0, 0, 1))
          assert.deepEqual(merged.tiledTexture.colorAt(new Vec2(15, 30)), new Color(0, 0, 1, 1))
          assert.deepEqual(merged.tiledTexture.colorAt(new Vec2(505, 505)), new Color(1, 0, 0, 1))
          assert.deepEqual(merged.tiledTexture.colorAt(new Vec2(515, 530)), new Color(0, 0, 1, 1))
        })
      })

      describe("undo", () => {
        it("restores structure", () => {
          picture.undoStack.redoAndPush(command)
          picture.undoStack.undo()
          assertLayerStructure(picture.rootLayer, originalStructure)
        })
      })
    })
  })

  describe("AddLayerCommand", () => {
    let command: AddLayerCommand
    beforeEach(() => {
      command = new AddLayerCommand(
        picture,
        new IndexPath([1, 1]),
        new ImageLayer(picture, {name: "Foo"})
      )
    })

    describe("redo", () => {
      it("adds layer", () => {
        picture.undoStack.redoAndPush(command)
        assertLayerStructure(picture.rootLayer, [
          {name: "1"},
          {name: "2", children: [
            {name: "3"},
            {name: "Foo"},
            {name: "4", children: [
              {name: "5"},
              {name: "6"}
            ]},
            {name: "7"},
          ]},
          {name: "8"}
        ])
      })
    })

    describe("undo", () => {
      it("restores structure", () => {
        picture.undoStack.redoAndPush(command)
        picture.undoStack.undo()
        assertLayerStructure(picture.rootLayer, originalStructure)
      })
    })
  })

  describe("RemoveLayerCommand", () => {
    let command: RemoveLayerCommand
    beforeEach(() => {
      command = new RemoveLayerCommand(
        picture,
        [new IndexPath([1, 0]), new IndexPath([1, 1, 1])],
      )
    })

    describe("redo", () => {
      it("removes layer", () => {
        picture.undoStack.redoAndPush(command)
        assertLayerStructure(picture.rootLayer, [
          {name: "1"},
          {name: "2", children: [
            {name: "4", children: [
              {name: "5"},
            ]},
            {name: "7"},
          ]},
          {name: "8"}
        ])
      })
    })

    describe("undo", () => {
      it("restores structure", () => {
        picture.undoStack.redoAndPush(command)
        picture.undoStack.undo()
        assertLayerStructure(picture.rootLayer, originalStructure)
      })
    })
  })

  describe("ChangeLayerPropsCommand", () => {
    let command: ChangeLayerPropsCommand
    beforeEach(() => {
      command = new ChangeLayerPropsCommand(
        picture,
        new IndexPath([1, 0]),
        "Change Props",
        {
          name: "Foobar",
          visible: false,
          blendMode: "plus",
          opacity: 0.9,
          preserveOpacity: true,
          clippingGroup: true
        }
      )
    })
    describe("redo", () => {
      it("changes layer props", () => {
        picture.undoStack.redoAndPush(command)
        const layer = picture.layerForPath(new IndexPath([1, 0]))!
        assert(layer.name == "Foobar")
        assert(layer.visible == false)
        assert(layer.blendMode == "plus")
        assert(layer.opacity == 0.9)
        assert(layer.preserveOpacity == true)
        assert(layer.clippingGroup == true)
      })
    })

    describe("undo", () => {
      it("restores layer", () => {
        picture.undoStack.redoAndPush(command)
        picture.undoStack.undo()
        const layer = picture.layerForPath(new IndexPath([1, 0]))!
        assert(layer.name == "3")
        assert(layer.visible == true)
        assert(layer.blendMode == "normal")
        assert(layer.opacity == 1)
        assert(layer.preserveOpacity == false)
        assert(layer.clippingGroup == false)
      })
    })
  })
})
