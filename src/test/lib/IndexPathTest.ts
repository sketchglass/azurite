import * as assert from "power-assert"
import IndexPath from "../../lib/IndexPath"

describe("IndexPath", () => {

  describe("length", () => {
    it("returns its length", () => {
      const path = new IndexPath([1, 2, 3])
      assert(path.length == 3)
    })
  })

  describe("parent", () => {
    it("returns parent", () => {
      const path1 = new IndexPath([1, 2, 3])
      assert.deepEqual(path1.parent!.indices, [1, 2])
      const path2 = new IndexPath([])
      assert(path2.parent === undefined)
    })
  })

  describe("at", () => {
    it("returns index at position", () => {
      const path = new IndexPath([1, 2, 3])
      assert(path.at(1) == 2)
    })
  })

  describe("last", () => {
    it("returns last index", () => {
      const path = new IndexPath([1, 2, 3])
      assert(path.last == 3)
    })
  })

  describe("slice", () => {
    it("returns sliced indices", () => {
      const path = new IndexPath([1, 2, 3, 4])
      assert.deepEqual(path.slice(1, -1).indices, [2, 3])
      assert.deepEqual(path.slice(2, 4).indices, [3, 4])
    })
  })

  describe("child", () => {
    it("returns child with index", () => {
      const path = new IndexPath([1, 2, 3])
      assert.deepEqual(path.child(4).indices, [1, 2, 3, 4])
    })
  })

  describe("equals", () => {
    it("returns if equals", () => {
      const path1 = new IndexPath([1, 2, 3])
      const path2 = new IndexPath([1, 2, 3])
      const path3 = new IndexPath([3, 2, 1])
      const path4 = new IndexPath([1, 2])
      assert(path1.equals(path2))
      assert(!path1.equals(path3))
      assert(!path1.equals(path4))
    })
  })

  describe("compare", () => {
    it("does lexicographic comparison", () => {
      const path1 = new IndexPath([1, 2, 3])
      const path2 = new IndexPath([1, 2, 3])
      const path3 = new IndexPath([3, 2, 1])
      const path4 = new IndexPath([1, 2])
      assert(path2.compare(path1) == 0)
      assert(path3.compare(path1) > 0)
      assert(path1.compare(path3) < 0)
      assert(path4.compare(path1) < 0)
      assert(path1.compare(path4) > 0)
    })
  })
})
