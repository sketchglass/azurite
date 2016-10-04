const sh = require("shelljs")
const packager = require('electron-packager')
const argv = require("yargs").argv

sh.config.verbose = true

async function package(platform: string) {
  sh.mkdir('-p', 'build')

  const files = ['package.json', 'dist/index.html']
  for (const file of files) {
    sh.cp(file, 'build')
  }

  sh.cd("build")
  sh.exec("npm install --production")

  const options = {
    dir: ".",
    platform: "win32",
    arch: "x64",
    overwrite: true,
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
