const packager = require('electron-packager')
const sh = require('shelljs')
const glob = require('glob')
const path = require('path')

sh.config.verbose = true

const INCLUDE_MODULES = [
  'receive-tablet-event', 'bindings', 'nbind'
]

function include(path: string) {
  for (const module of INCLUDE_MODULES) {
    if (path.startsWith(`node_modules/${module}`)) {
      // ignore object files
      return !path.endsWith('.o') && !path.endsWith('.obj')
    }
  }

  if (path.endsWith('nbind.node')) {
    return true
  }

  // include dist (without sourcemap)
  if (path.startsWith('dist')) {
    return !path.endsWith('.map')
  }
  // include package
  if (path === 'package.json') {
    return true
  }
  return false
}

async function copyFiles(appPath: string) {
  const distPath = path.join(appPath, 'Azurite.app/Contents/Resources/app')
  sh.mkdir(distPath)

  const rootPath = path.dirname(__dirname)
  const files = glob.sync(path.join(rootPath, '/**/*'))
  // FIXME: why glob does not contain package.json?????
  // files.push(path.join(rootPath, 'package.json'))

  for (const file of files) {
    const relPath = path.relative(rootPath, file)
    const dst = path.join(distPath, path.dirname(relPath))
    if (include(relPath)) {
      sh.mkdir('-p', dst)
      sh.cp(file, dst)
    }
  }
}

async function package() {
  // sh.exec("npm run build")

  const options = {
    dir: '.',
    out: 'build',
    overwrite: true,
    ignore: () => true
  }

  const paths = await new Promise<string[]>((resolve, reject) => {
    packager(options, (err: Error, paths: string[]) => {
      if (err) {
        reject(err)
      } else {
        resolve(paths)
      }
    })
  })
  for (const path of paths) {
    await copyFiles(path)
  }
}

package()
