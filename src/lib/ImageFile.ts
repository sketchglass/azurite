async function blobToBuffer(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("loadend", (ev) => {
      if (ev["error"]) {
        reject(ev["error"])
      } else {
        resolve(new Buffer(reader.result))
      }
    })
    reader.readAsArrayBuffer(blob)
  })
}

async function toBlob(canvas: HTMLCanvasElement, mimeType: string) {
  return new Promise<Blob|null>((resolve) => {
    canvas.toBlob(resolve, mimeType)
  })
}

export async function encodeImageData(image: ImageData, mimeType: string) {
  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext("2d")!
  context.putImageData(image, 0, 0)

  const blob = await toBlob(canvas, mimeType)
  if (blob) {
    return blobToBuffer(blob)
  } else {
    throw new Error("Failed to encode image")
  }
}

function imageFromURL(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve(image)
    }
    image.onerror = err => {
      reject(err)
    }
    image.src = url
  })
}

export async function decodeToImageData(buffer: Buffer, mimeType: string) {
  const blob = new Blob([buffer], {type: mimeType})
  const url = URL.createObjectURL(blob)
  const image = await imageFromURL(url)
  const {width, height} = image

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")!
  context.drawImage(canvas, 0, 0)

  return context.getImageData(0, 0, width, height)
}
