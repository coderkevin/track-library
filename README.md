# Track Library

A TypeScript Node.js application for managing and analyzing audio tracks for algorave DJing with strudel.

## Features

- **Audio Import**: Import MP3 and WAV files into the library with interactive metadata editing
- **Format Conversion**: Automatically converts all MP3 files to uncompressed WAV format
- **Music Metadata**: Extract and edit Title, Artist, Album, and Genre from ID3 tags
- **BPM Analysis**: Detect tempo and tempo changes throughout tracks
- **Key Detection**: Identify musical key of tracks
- **Beatgrid Analysis**: Map tempo changes for complex tracks
- **CLI Interface**: Simple command-line interface for all operations

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start using the tool directly (no build step needed):

## Usage

### Import a Track

```bash
npm run import path/to/your/track.mp3
```

### List Tracks

```bash
npm run list
```

Options:

- `--bpm <range>`: Filter by BPM range (e.g., "120-140")
- `--key <key>`: Filter by musical key
- `--duration <range>`: Filter by duration range (e.g., "60-300")
- `--artist <artist>`: Filter by artist name (partial match)
- `--search <term>`: Search in title, artist, album, or genre (partial match)
- `--json`: Output as JSON

Examples:

```bash
# List all tracks by a specific artist
npm run list -- --artist "Aphex Twin"

# Search for tracks containing "ambient" in title, artist, album, or genre
npm run list -- --search "ambient"

# Find electronic tracks between 120-140 BPM
npm run list -- --search "electronic" --bpm "120-140"

# Export all tracks as JSON
npm run list -- --json
```

### Show Version

```bash
npm run version
```

### Analyze Tracks

```bash
npm run analyze [track-id]
```

## Project Structure

```
src/
├── cli/                 # Command-line interface
│   ├── import.ts       # Import command
│   ├── list.ts         # List command
│   ├── analyze.ts      # Analyze command
│   └── version.ts      # Version command
├── core/               # Core functionality
│   ├── audioProcessor.ts
│   ├── trackLibrary.ts
│   └── analysis/       # Analysis modules
│       ├── constants.ts
│       ├── bpmAnalyzer.ts
│       ├── keyAnalyzer.ts
│       └── loopAnalyzer.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── version.ts      # Version utility
│   └── metadataExtractor.ts  # Music metadata extraction
└── index.ts           # Main entry point

tracks/                 # Track storage (WAV files and JSON metadata)
```

**Note:** All TypeScript files are run directly using `tsx` - no build step required!

## Track Metadata Format

Each track is stored with a JSON metadata file containing:

```json
{
  "id": "unique-track-id",
  "filename": "original-filename.mp3",
  "originalPath": "/path/to/original/file",
  "wavPath": "/path/to/tracks/file.wav",
  "duration": 180.5,
  "sampleRate": 44100,
  "bitDepth": 16,
  "channels": 2,
  "bpm": 128.5,
  "key": "A#",
  "title": "Track Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "genre": "Electronic",
  "beatgrid": [
    {
      "time": 0,
      "bpm": 128.5,
      "confidence": 0.95
    }
  ],
  "beatgrid": [
    {
      "start": 32.0,
      "end": 64.0,
      "bpm": 128.5,
      "confidence": 0.9,
      "type": "verse",
      "name": "verse_8bar_loop",
      "description": "8-bar verse loop (32.0s)"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Dependencies

- **fluent-ffmpeg**: Audio processing and conversion
- **commander**: CLI interface
- **chalk**: Colored terminal output
- **ora**: Loading spinners
- **inquirer**: Interactive prompts

## Development

1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Watch for changes: `npm run dev`

## License

MIT
