# Source structure of Azurite

* `dist`: HTML / JavaScript / CSS / other assets that are finally referenced by Electron
* `bundles`: vender assets such as icons / fonts
* `docs`: Documentations
* `scripts`: Scripts used in development and build process
* `src`: Source codes
  * `common`: Common codes that are accessed from both renderer/main process
  * `lib`: Utility codes that are not tied to Azurite itself
  * `main`: Codes that run in Electron main process
  * `nativelib`: Native codes written in (Objective-)C++. [nbind](https://github.com/charto/nbind) is used to make them accessbie from JavaScript
  * `renderer`: Codes that run in Electron renderer process
    * `actions`: Unit of code mainly trigerred by menu items, keyboard shortcuts and buttons
    * `app`: Codes that manages application
    * `commands`: Undoable unit of code that modifies models
    * `formats`: Codes that add support for file formats
    * `models`: Codes that represents data maniplated in Azurite, such as Pictures or Layers
    * `services`: Miscellaneous sets of code that do something
    * `tools`: Tools that interact with user in viewport
    * `viewmodels`: Abstractions of complex views
    * `views`: View components
  * `styles`: CSS styles
  * `test`: Test codes
