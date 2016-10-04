const packager = require('electron-packager')
const argv = require("yargs").argv

function ignore(path: string) {
  if (!path) {
    return false
  }
  if (path.startsWith("/node_modules")) {
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

async function package(platform: string) {
  const options = {
    dir: ".",
    out: "build",
    platform: platform,
    arch: "x64",
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

package(argv.platform)
