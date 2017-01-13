#include <string>
#include <iostream>
#include "nbind/api.h"
#import <Cocoa/Cocoa.h>

static NSTextField *findTextField(NSView *view) {
  for (NSView *subview in view.subviews) {
    if ([subview isKindOfClass:[NSTextField class]]) {
      return (NSTextField *)subview;
    } else {
      NSTextField* result = findTextField(subview);
      if (result) {
        return result;
      }
    }
  }
  return nullptr;
}

// http://stackoverflow.com/a/29336473
static void setTitleColorImpl(NSWindow *window, double r, double g, double b, double a) {
  auto titleField = findTextField([window contentView].superview);
  auto color = [NSColor colorWithSRGBRed:r green:g blue:b alpha:a];
  if (titleField) {
    auto attributedStr = [[NSAttributedString alloc] initWithString:titleField.stringValue attributes:@{
      NSForegroundColorAttributeName: color
    }];
    titleField.attributedStringValue = attributedStr;
  }
}

static NSWindow *windowFromHandle(const nbind::Buffer &handle) {
  auto view = *((NSView **)handle.data());
  return view.window;
}

struct WindowUtilMac {
  static void initWindow(nbind::Buffer handle) {
    auto win = windowFromHandle(handle);
    win.titlebarAppearsTransparent = true;
    win.styleMask |= NSFullSizeContentViewWindowMask;
  }

  static void setTitleColor(nbind::Buffer handle, double r, double g, double b, double a) {
    auto win = windowFromHandle(handle);
    setTitleColorImpl(win, r, g, b, a);
  }
};

#include "nbind/nbind.h"

NBIND_CLASS(WindowUtilMac) {
  method(initWindow);
  method(setTitleColor);
}
