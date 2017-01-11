#include <string>
#include <iostream>
#include "nbind/api.h"
#import <Cocoa/Cocoa.h>

struct WindowUtilMac {
  static void initWindow(nbind::Buffer handle) {
    auto view = *((NSView **)handle.data());
    auto win = view.window;
    win.titlebarAppearsTransparent = true;
    win.styleMask |= NSFullSizeContentViewWindowMask;
  }
};

#include "nbind/nbind.h"

NBIND_CLASS(WindowUtilMac) {
  method(initWindow);
}
