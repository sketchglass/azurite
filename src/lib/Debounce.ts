
// ensure 1 call per frame
export
function frameDebounce<T extends Function>(func: T): T {
  let needCall = false
  let args: IArguments
  function onFrame() {
    if (needCall) {
      func.apply(this, args)
      needCall = false
    }
  }
  function debounced() {
    needCall = true
    args = arguments
    requestAnimationFrame(onFrame)
  }
  return debounced as any
}
