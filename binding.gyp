{
  "targets": [
    {
      "includes": [
        "auto.gypi"
      ],
      "sources": [
      ],
      "conditions": [
        ['OS=="mac"', {
          'xcode_settings': {
            'OTHER_CFLAGS': [
              '-std=c++11',
              '-stdlib=libc++'
            ]
          },
          "sources": [ "src/nativelib/WindowUtilMac.mm" ]
        }]
      ]
    }
  ],
  "includes": [
    "auto-top.gypi"
  ]
}
