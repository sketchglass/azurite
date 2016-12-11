const electron = require("electron")
const {app} = process.type === "browser" ? electron : electron.remote

export
let contentBase = process.env.NODE_ENV === "development" ? "http://localhost:23000" : `file://${app.getAppPath()}/dist`
