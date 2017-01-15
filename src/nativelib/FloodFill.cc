#include <vector>
#include <tuple>
#include "nbind/api.h"

std::vector<std::tuple<int, int>> floodFillStack;

// Stack-based scanline flood fill from http://lodev.org/cgtutor/floodfill.html
void floodFill(int x, int y, int w, int h, int stride, nbind::Buffer srcBuf, nbind::Buffer dstBuf) {
  auto srcBase = (const uint32_t *)srcBuf.data();
  auto dstBase = (uint32_t *)dstBuf.data();

  if (!(0 <= x && x < w && 0 <= y && y < h)) {
    return;
  }
  floodFillStack.clear();
  floodFillStack.push_back(std::make_tuple(x, y));

  while (floodFillStack.size() > 0) {
    int x0;
    int y;
    std::tie(x0, y) = floodFillStack.back();
    floodFillStack.pop_back();

    int x = x0;
    int byteOffset = x >> 5;
    auto src = srcBase + y * stride + byteOffset;
    auto dst = dstBase + y * stride + byteOffset;
    uint32_t mask = 1 << (x - (byteOffset << 5));
    if (*dst & mask) {
      continue;
    }

    while (x >= 0 && *src & mask) {
      --x;
      mask >>= 1;
      if (mask == 0) {
        --src;
      }
    }
    ++x;
    mask <<= 1;
    if (mask == 0) {
      ++src;
    }

    bool spanAbove = false;
    bool spanBelow = false;
    auto srcAbove = src - stride;
    auto srcBelow = src + stride;

    while (x < w && *src & mask) {
      *dst &= mask;
      if (!spanAbove && y > 0 && *srcAbove & mask) {
        floodFillStack.push_back(std::make_tuple(x, y - 1));
        spanAbove = true;
      } else if (spanAbove && y > 0 && !(*srcAbove & mask)) {
        spanAbove = false;
      }
      if (!spanBelow && y < h - 1 && *srcBelow & mask) {
        floodFillStack.push_back(std::make_tuple(x, y + 1));
        spanBelow = true;
      } else if (spanBelow && y < h - 1 && !(*srcBelow & mask)) {
        spanBelow = false;
      }

      ++x;
      mask <<= 1;
      if (mask == 0) {
        ++src;
        ++dst;
        ++srcAbove;
        ++srcBelow;
      }
    }
  }
}

#include "nbind/nbind.h"

NBIND_GLOBAL() {
  function(floodFill);
}
