# azurite

Casual Painting App in Electron

[![CircleCI](https://circleci.com/gh/sketchglass/azurite.svg?style=svg)](https://circleci.com/gh/sketchglass/azurite)

## Prerequisites

* Node.js

### Windows

* Python 2.7 / Visual C++ (for building native modules with node-gyp)

## Build

```
npm install
npm run watch
```

## Run App

```
npm run app
```

## Test

```
npm test
```

### with webpack devserver

```
# assuming you are running `npm run watch`
npm run test:dev
```

## Package app

```
npm run package
```

The packaged app will be in `/build`.
