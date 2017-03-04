import ImageFormat from "../formats/ImageFormat"

export default
class FormatRegistry {
  imageFormats: ImageFormat[] = []

  imageFormatForExtension(ext: string) {
    return this.imageFormats.find(f => f.extensions.includes(ext))
  }

  imageExtensions() {
    return this.imageFormats.map(f => f.extensions).reduce((a, b) => a.concat(b), [])
  }
}

export const formatRegistry = new FormatRegistry()

export function addImageFormat(klass: {new(): ImageFormat}) {
  formatRegistry.imageFormats.push(new klass())
}
