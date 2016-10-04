const packager = require('electron-packager')
const sh = require("shelljs")

sh.config.verbose = true

function ignore(path: string) {
  if (!path) {
    return false
  }
  if (path == "/node_modules") {
    return false
  }
  if (path.startsWith("/node_modules/receive-tablet-event") || path.startsWith("/node_modules/bindings")) {
    return false
  }
  if (path.startsWith("/dist")) {
    if (path.endsWith(".map")) {
      return true
    }
    return false
  }
  if (path == "/package.json") {
    return false
  }
  return true
}

async function package() {
  sh.exec("webpack")

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
