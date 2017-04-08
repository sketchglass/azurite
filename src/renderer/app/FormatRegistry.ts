import PictureFormat from "../formats/PictureFormat"

export default
class FormatRegistry {
  pictureFormats: PictureFormat[] = []

  pictureFormatForExtension(ext: string) {
    return this.pictureFormats.find(f => f.extensions.includes(ext))
  }

  pictureExtensions() {
    return this.pictureFormats.map(f => f.extensions).reduce((a, b) => a.concat(b), [])
  }
}

export const formatRegistry = new FormatRegistry()

export function addPictureFormat(klass: {new(): PictureFormat}) {
  formatRegistry.pictureFormats.push(new klass())
}
