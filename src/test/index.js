const context = require.context('mocha-loader!./', true, /Test\.ts$/)
context.keys().forEach(context)
