# Add Subtitles Extension

A simple yet powerful Firefox browser extension that allows you to add external subtitle files to any `<video>` element on web pages.

## Features

- Support for SRT, VTT, ASS/SSA subtitle formats
- Support for subtitles in ZIP archives
- Automatic Simplified to Traditional Chinese conversion
- Adjustable subtitle position, size, and color
- Full-screen playback support
- Keyboard shortcut controls

## Third-Party Libraries Declaration

This extension uses the following third-party libraries. For complete information, please refer to [THIRD_PARTY_LIBRARIES.md](THIRD_PARTY_LIBRARIES.md):

### JSZip v3.3.0
- **Purpose**: Handle subtitle files in ZIP archives
- **Source**: [Official GitHub Repository](https://github.com/Stuk/jszip)
- **License**: MIT License
- **Version**: 3.3.0 (stable version)

### OpenCC-JS v1.0.5
- **Purpose**: Simplified Chinese to Traditional Chinese conversion
- **Source**: [Official GitHub Repository](https://github.com/nk2028/opencc-js)
- **License**: MIT License  
- **Version**: 1.0.5 (stable version)

## Installation

1. Install from Firefox Add-ons Store (recommended)
2. Or download the `.xpi` file for manual installation

## Usage

1. Click the extension icon on web pages with `<video>` elements
2. Select the video element to add subtitles to
3. Upload subtitle files or enter the URL of subtitle files
4. Adjust subtitle settings (optional)
5. Enjoy videos with subtitles!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.