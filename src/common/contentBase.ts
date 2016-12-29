const electron = require("electron")
const {app} = process.type === "browser" ? electron : electron.remote

const useDevServer = ["development", "test"].indexOf(process.env.NODE_ENV) >= 0

export
let contentBase = useDevServer ? "http://localhost:23000" : `file://${app.getAppPath()}/dist`
