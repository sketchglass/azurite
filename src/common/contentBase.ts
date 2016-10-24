
export
let contentBase = process.env.NODE_ENV == "development" ? "http://localhost:23000" : `file://${__dirname}/..`
