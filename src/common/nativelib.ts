const electron = require('electron')
let appPath: string
if (process.type === 'renderer') {
  appPath = electron.remote.app.getAppPath()
} else {
  appPath = electron.app.getAppPath()
}

export = require('nbind').init(appPath).lib
