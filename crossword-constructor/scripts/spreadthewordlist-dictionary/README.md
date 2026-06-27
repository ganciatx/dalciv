# Spread the Word List → Apple Dictionary

Converts [Spread the Word List](https://www.spreadthewordlist.com/) `.dict` files (`word;frequency` per line) into a macOS `.dictionary` bundle for Dictionary.app.

## Requirements

- macOS with Dictionary.app
- [Dictionary Development Kit](https://github.com/SebastianSzturo/Dictionary-Development-Kit) (from Apple's Additional Tools for Xcode, or the community mirror)

## Build

```bash
cd crossword-constructor/scripts/spreadthewordlist-dictionary

# 1. Generate Apple Dictionary XML (~44 MB for the full list)
python3 convert.py ~/Downloads/spreadthewordlist.dict -o SpreadTheWordList.xml

# 2. Point Makefile at your DDK install, then build
export DICT_BUILD_TOOL_DIR="/path/to/Dictionary Development Kit"
make

# 3. Install (optional)
make install
```

Output: `objects/Spread the Word List.dictionary`

Each entry shows the word and its crossword frequency score. Enable it in Dictionary.app → Settings.
