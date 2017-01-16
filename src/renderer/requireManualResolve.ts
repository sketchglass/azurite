import {remote} from "electron"
const resolve = require("resolve")

// workaround: looks like Electron can't resolve require path from JavaScripts loaded in http protocol
// so we have to add alternative require that resolves path manually
// todo: fix Electron
window["requireManualResolve"] = (request: string) => {
  const resolved = resolve.sync(request, {basedir: remote.app.getAppPath()})
  return window["require"](resolved)
}
