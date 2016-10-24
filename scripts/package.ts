const packager = require('electron-packager')
const sh = require("shelljs")

sh.config.verbose = true

function ignore(path: string) {
  if (!path) {
    return false
  }
  // don't ignore node_modules folder itself
  if (path == "/node_modules") {
    return false
  }
  // include receive-tablet-event and bindigns module
  if (path.startsWith("/node_modules/receive-tablet-event") || path.startsWith("/node_modules/bindings")) {
    // ignore object files
    if (path.endsWith(".o") || path.endsWith(".obj")) {
      return true
    }
    return false
  }
  // include dist (without sourcemap)
  if (path.startsWith("/dist")) {
    if (path.endsWith(".map")) {
      return true
    }
    return false
  }
  // include node-modues
  if (path == "/package.json") {
    return false
  }
  return true
}

async function package() {
  sh.exec("npm run build")

  const options = {
    dir: ".",
    out: "build",
    overwrite: true,
    ignore: ignore
  }

  await new Promise<string[]>((resolve, reject) => {
    packager(options, (err: Error, paths: string[]) => {
      if (err) {
        reject(err)
      } else {
        resolve(paths)
      }
    })
  })
}

package()
