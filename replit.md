# Chess Vision Trainer

A web-based chess visualization training application to help players improve their board vision skills.

## Overview

This application helps chess players develop their visualization abilities through three training modes:
- **Movement Challenge**: Identify all valid moves for a piece (Queen, Rook, Bishop, Knight)
- **3-Move Puzzle**: Find a path to reach a target square within 3 moves
- **Square Colors**: Quickly identify whether a square is light or dark

## Project Structure

```
/
├── index.html   - Main HTML structure with chessboard and UI
├── style.css    - Chess.com-inspired styling with blue/white board
├── app.js       - Game logic including piece movement calculations
└── replit.md    - Project documentation
```

## Technical Details

- Pure HTML/CSS/JavaScript (no frameworks)
- Responsive design for desktop (1920x1080) and iPhone screens
- Blue (#5b8bbd) and white (#e8eef4) color scheme for the board
- Unicode chess pieces for clean visuals

## Running the Application

The app is served via Python's built-in HTTP server on port 5000.

## Recent Changes

- 2025-12-02: Initial creation with all three puzzle types from Python source
