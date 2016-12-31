import * as assert from 'power-assert'
import Picture from "../../renderer/models/Picture"
import {GroupLayer, ImageLayer} from "../../renderer/models/Layer"
import {MoveLayerCommand, CopyLayerCommand, GroupLayerCommand, AddLayerCommand, RemoveLayerCommand} from "../../renderer/commands/LayerCommand"

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
        [[1, 0], [1, 1, 0]],
        [1, 2]
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
        [[1, 0], [1, 1, 0]],
        [1, 2]
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
        [[1, 0], [1, 1, 0]],
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

  describe("AddLayerCommand", () => {
    let command: AddLayerCommand
    beforeEach(() => {
      command = new AddLayerCommand(
        picture,
        [1, 1],
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
        [[1, 0], [1, 1, 1]],
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
})
