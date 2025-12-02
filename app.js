class ChessTrainer {
    constructor() {
        this.boardSize = 8;
        this.files = 'abcdefgh';
        this.ranks = '12345678';
        this.score = 0;
        this.totalAttempts = 0;
        this.obstructions = [];
        this.selectedSquares = new Set();
        this.currentMode = null;
        this.currentPiece = null;
        this.piecePosition = null;
        this.targetPosition = null;
        this.validMoves = new Set();
        this.attempts = 0;
        this.maxAttempts = 3;
        this.pathMoves = [];
        this.currentPathIndex = 0;
        this.timerInterval = null;
        this.timeRemaining = 30;
        this.colorCorrect = 0;

        this.pieces = {
            Queen: '\u2655',
            Rook: '\u2656',
            Bishop: '\u2657',
            Knight: '\u2658'
        };

        this.init();
    }

    init() {
        this.createBoard();
        this.bindEvents();
        this.updateStats();
    }

    createBoard() {
        const board = document.getElementById('chessboard');
        board.innerHTML = '';

        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                const isLight = (row + col) % 2 === 1;
                square.className = `square ${isLight ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.dataset.square = this.coordsToSquare(row, col);
                board.appendChild(square);
            }
        }
    }

    bindEvents() {
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMode(btn.dataset.mode));
        });

        document.querySelectorAll('.piece-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectPiece(btn.dataset.piece));
        });

        document.getElementById('obstructions').addEventListener('input', (e) => {
            document.getElementById('obs-value').textContent = e.target.value;
        });

        document.getElementById('time-limit').addEventListener('input', (e) => {
            document.getElementById('time-value').textContent = e.target.value;
        });

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('back-btn').addEventListener('click', () => this.showScreen('menu-screen'));
        document.getElementById('submit-btn').addEventListener('click', () => this.submitAnswer());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('next-btn').addEventListener('click', () => this.nextPuzzle());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());

        document.getElementById('white-btn').addEventListener('click', () => this.answerColor('light'));
        document.getElementById('blue-btn').addEventListener('click', () => this.answerColor('dark'));
        document.getElementById('color-quit-btn').addEventListener('click', () => this.quitGame());

        document.getElementById('chessboard').addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (square) this.handleSquareClick(square);
        });
    }

    squareToCoords(square) {
        if (!square || square.length !== 2) return [null, null];
        const file = square[0].toLowerCase();
        const rank = square[1];
        if (!this.files.includes(file) || !this.ranks.includes(rank)) return [null, null];
        const col = this.files.indexOf(file);
        const row = parseInt(rank) - 1;
        return [row, col];
    }

    coordsToSquare(row, col) {
        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
            return this.files[col] + (row + 1);
        }
        return null;
    }

    isValidSquare(square) {
        const [row, col] = this.squareToCoords(square);
        return row !== null && col !== null;
    }

    isObstruction(row, col) {
        return this.obstructions.some(obs => obs[0] === row && obs[1] === col);
    }

    getQueenMoves(row, col) {
        const moves = new Set();
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];

        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    if (this.isObstruction(newRow, newCol)) break;
                    moves.add(this.coordsToSquare(newRow, newCol));
                } else {
                    break;
                }
            }
        }
        return moves;
    }

    getRookMoves(row, col) {
        const moves = new Set();
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    if (this.isObstruction(newRow, newCol)) break;
                    moves.add(this.coordsToSquare(newRow, newCol));
                } else {
                    break;
                }
            }
        }
        return moves;
    }

    getBishopMoves(row, col) {
        const moves = new Set();
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    if (this.isObstruction(newRow, newCol)) break;
                    moves.add(this.coordsToSquare(newRow, newCol));
                } else {
                    break;
                }
            }
        }
        return moves;
    }

    getKnightMoves(row, col) {
        const moves = new Set();
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                if (!this.isObstruction(newRow, newCol)) {
                    moves.add(this.coordsToSquare(newRow, newCol));
                }
            }
        }
        return moves;
    }

    getMoves(piece, row, col) {
        switch (piece) {
            case 'Queen': return this.getQueenMoves(row, col);
            case 'Rook': return this.getRookMoves(row, col);
            case 'Bishop': return this.getBishopMoves(row, col);
            case 'Knight': return this.getKnightMoves(row, col);
            default: return new Set();
        }
    }

    findKnightPaths(start, target, maxMoves = 3) {
        const [startRow, startCol] = this.squareToCoords(start);
        const [targetRow, targetCol] = this.squareToCoords(target);

        if (startRow === null || targetRow === null) return [];
        if (start === target) return [[start]];

        const paths = [];
        const queue = [[start, startRow, startCol, [start]]];

        while (queue.length > 0) {
            const [current, row, col, path] = queue.shift();

            if (path.length > maxMoves) continue;

            const moves = this.getKnightMoves(row, col);

            for (const move of moves) {
                if (move === target) {
                    paths.push([...path, move]);
                } else if (!path.includes(move) && path.length < maxMoves) {
                    const [newRow, newCol] = this.squareToCoords(move);
                    if (newRow !== null) {
                        queue.push([move, newRow, newCol, [...path, move]]);
                    }
                }
            }
        }
        return paths;
    }

    placeObstructions(numObstructions, piecePos) {
        this.obstructions = [];
        const available = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r !== piecePos[0] || c !== piecePos[1]) {
                    if (!this.targetPosition || 
                        (r !== this.targetPosition[0] || c !== this.targetPosition[1])) {
                        available.push([r, c]);
                    }
                }
            }
        }

        for (let i = 0; i < Math.min(numObstructions, available.length); i++) {
            const idx = Math.floor(Math.random() * available.length);
            this.obstructions.push(available.splice(idx, 1)[0]);
        }
    }

    getSquareColor(row, col) {
        return (row + col) % 2 === 1 ? 'light' : 'dark';
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    selectMode(mode) {
        this.currentMode = mode;
        
        const pieceGroup = document.getElementById('piece-select-group');
        const obsGroup = document.getElementById('obstruction-group');
        const timeGroup = document.getElementById('time-limit-group');

        if (mode === 'color') {
            pieceGroup.style.display = 'none';
            obsGroup.style.display = 'none';
            timeGroup.style.display = 'block';
            document.getElementById('setup-title').textContent = 'Square Color Training';
        } else {
            pieceGroup.style.display = 'block';
            obsGroup.style.display = 'block';
            timeGroup.style.display = 'none';
            document.getElementById('setup-title').textContent = 
                mode === 'movement' ? 'Movement Challenge' : '3-Move Puzzle';
        }

        this.showScreen('setup-screen');
    }

    selectPiece(piece) {
        this.currentPiece = piece;
        document.querySelectorAll('.piece-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.piece === piece);
        });
    }

    startGame() {
        if (this.currentMode === 'color') {
            this.startColorGame();
            return;
        }

        if (!this.currentPiece) {
            alert('Please select a piece first!');
            return;
        }

        this.attempts = 0;
        this.selectedSquares.clear();
        this.pathMoves = [];
        this.currentPathIndex = 0;

        const numObs = parseInt(document.getElementById('obstructions').value);
        const pieceRow = Math.floor(Math.random() * 8);
        const pieceCol = Math.floor(Math.random() * 8);
        this.piecePosition = [pieceRow, pieceCol];

        if (this.currentMode === 'pathfinding') {
            this.setupPathfindingPuzzle(numObs, pieceRow, pieceCol);
        } else {
            this.targetPosition = null;
            this.placeObstructions(numObs, this.piecePosition);
            this.validMoves = this.getMoves(this.currentPiece, pieceRow, pieceCol);
        }

        this.updateBoard();
        this.updateGameInfo();
        this.showScreen('game-screen');
        this.updateSelectedDisplay();
        document.getElementById('hint-btn').disabled = true;
        document.getElementById('submit-btn').style.display = 'block';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').className = 'feedback';
    }

    setupPathfindingPuzzle(numObs, startRow, startCol) {
        const startSquare = this.coordsToSquare(startRow, startCol);
        let targetSquare = null;
        let paths = [];

        if (this.currentPiece === 'Knight') {
            for (let attempt = 0; attempt < 50; attempt++) {
                const targetRow = Math.floor(Math.random() * 8);
                const targetCol = Math.floor(Math.random() * 8);
                
                if (targetRow === startRow && targetCol === startCol) continue;
                
                this.targetPosition = [targetRow, targetCol];
                this.placeObstructions(numObs, this.piecePosition);
                
                if (this.isObstruction(targetRow, targetCol)) continue;

                const tempTarget = this.coordsToSquare(targetRow, targetCol);
                paths = this.findKnightPaths(startSquare, tempTarget, 3);
                
                if (paths.length > 0) {
                    targetSquare = tempTarget;
                    break;
                }
            }
        } else {
            this.placeObstructions(numObs, this.piecePosition);
            const moves = this.getMoves(this.currentPiece, startRow, startCol);
            const movesArray = Array.from(moves);
            
            if (movesArray.length > 0) {
                targetSquare = movesArray[Math.floor(Math.random() * movesArray.length)];
                const [targetRow, targetCol] = this.squareToCoords(targetSquare);
                this.targetPosition = [targetRow, targetCol];
                paths = [[startSquare, targetSquare]];
            }
        }

        this.validPaths = paths;
        this.validMoves = new Set();
    }

    startColorGame() {
        this.colorCorrect = 0;
        this.timeRemaining = parseInt(document.getElementById('time-limit').value);
        
        this.createBoard();
        this.showScreen('color-game-screen');
        this.generateColorQuestion();
        this.startTimer();
    }

    generateColorQuestion() {
        const row = Math.floor(Math.random() * 8);
        const col = Math.floor(Math.random() * 8);
        const square = this.coordsToSquare(row, col);
        
        this.currentColorSquare = { row, col, square };
        document.getElementById('square-question').textContent = square.toUpperCase();
        document.getElementById('color-feedback').textContent = '';
        document.getElementById('color-feedback').className = 'feedback';
    }

    answerColor(answer) {
        const correctColor = this.getSquareColor(
            this.currentColorSquare.row, 
            this.currentColorSquare.col
        );

        const feedback = document.getElementById('color-feedback');

        if (answer === correctColor) {
            this.colorCorrect++;
            feedback.textContent = 'Correct!';
            feedback.className = 'feedback success';
        } else {
            feedback.textContent = `Wrong! It's ${correctColor === 'light' ? 'Light' : 'Dark'}`;
            feedback.className = 'feedback error';
        }

        document.getElementById('color-correct').textContent = this.colorCorrect;

        setTimeout(() => this.generateColorQuestion(), 500);
    }

    startTimer() {
        document.getElementById('color-timer').textContent = this.timeRemaining;
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            document.getElementById('color-timer').textContent = this.timeRemaining;
            
            if (this.timeRemaining <= 0) {
                this.endColorGame();
            }
        }, 1000);
    }

    endColorGame() {
        clearInterval(this.timerInterval);
        
        const feedback = document.getElementById('color-feedback');
        feedback.textContent = `Time's up! You got ${this.colorCorrect} correct!`;
        feedback.className = 'feedback info';
        
        document.getElementById('white-btn').disabled = true;
        document.getElementById('blue-btn').disabled = true;
        
        setTimeout(() => {
            document.getElementById('white-btn').disabled = false;
            document.getElementById('blue-btn').disabled = false;
            this.showScreen('menu-screen');
        }, 3000);
    }

    updateBoard() {
        this.createBoard();

        for (const [row, col] of this.obstructions) {
            const square = document.querySelector(
                `.square[data-row="${row}"][data-col="${col}"]`
            );
            if (square) {
                square.classList.add('obstruction');
            }
        }

        if (this.piecePosition) {
            const [row, col] = this.piecePosition;
            const square = document.querySelector(
                `.square[data-row="${row}"][data-col="${col}"]`
            );
            if (square) {
                square.classList.add('has-piece');
                const pieceEl = document.createElement('span');
                pieceEl.className = 'piece';
                pieceEl.textContent = this.pieces[this.currentPiece];
                square.appendChild(pieceEl);
            }
        }

        if (this.targetPosition) {
            const [row, col] = this.targetPosition;
            const square = document.querySelector(
                `.square[data-row="${row}"][data-col="${col}"]`
            );
            if (square) {
                square.classList.add('target');
            }
        }

        for (const sq of this.selectedSquares) {
            const [row, col] = this.squareToCoords(sq);
            const squareEl = document.querySelector(
                `.square[data-row="${row}"][data-col="${col}"]`
            );
            if (squareEl && !squareEl.classList.contains('obstruction')) {
                squareEl.classList.add('selected');
            }
        }
    }

    handleSquareClick(squareEl) {
        if (this.currentMode === 'color') return;
        
        const square = squareEl.dataset.square;
        const pieceSquare = this.coordsToSquare(this.piecePosition[0], this.piecePosition[1]);
        
        if (square === pieceSquare) return;
        if (squareEl.classList.contains('obstruction')) return;

        if (this.currentMode === 'pathfinding') {
            if (this.selectedSquares.has(square)) {
                this.selectedSquares.delete(square);
                this.pathMoves = this.pathMoves.filter(m => m !== square);
            } else {
                this.selectedSquares.add(square);
                this.pathMoves.push(square);
            }
        } else {
            if (this.selectedSquares.has(square)) {
                this.selectedSquares.delete(square);
            } else {
                this.selectedSquares.add(square);
            }
        }

        this.updateBoard();
        this.updateSelectedDisplay();
    }

    updateSelectedDisplay() {
        const display = document.getElementById('selected-list');
        if (this.currentMode === 'pathfinding') {
            display.textContent = this.pathMoves.length > 0 
                ? this.pathMoves.map(s => s.toUpperCase()).join(' → ')
                : 'None';
        } else {
            display.textContent = this.selectedSquares.size > 0 
                ? Array.from(this.selectedSquares).sort().map(s => s.toUpperCase()).join(', ')
                : 'None';
        }
    }

    updateGameInfo() {
        const title = document.getElementById('challenge-title');
        const desc = document.getElementById('challenge-desc');
        const attemptsInfo = document.getElementById('attempts-info');

        const pieceSquare = this.coordsToSquare(this.piecePosition[0], this.piecePosition[1]);

        if (this.currentMode === 'movement') {
            title.textContent = `${this.currentPiece} Movement`;
            desc.textContent = `${this.currentPiece} is on ${pieceSquare.toUpperCase()}. Click all squares it can move to.`;
        } else {
            const targetSquare = this.coordsToSquare(this.targetPosition[0], this.targetPosition[1]);
            title.textContent = `${this.currentPiece} Path`;
            desc.textContent = `Move ${this.currentPiece} from ${pieceSquare.toUpperCase()} to ${targetSquare.toUpperCase()} in 3 moves or less.`;
        }

        attemptsInfo.textContent = `Attempts: ${this.attempts}/${this.maxAttempts}`;
    }

    submitAnswer() {
        const feedback = document.getElementById('feedback');
        
        if (this.currentMode === 'movement') {
            this.checkMovementAnswer(feedback);
        } else {
            this.checkPathAnswer(feedback);
        }
    }

    checkMovementAnswer(feedback) {
        const userMoves = this.selectedSquares;
        
        if (this.setsEqual(userMoves, this.validMoves)) {
            this.score++;
            this.totalAttempts++;
            this.updateStats();
            
            feedback.textContent = 'Correct! Well done!';
            feedback.className = 'feedback success';
            
            this.showValidMoves();
            document.getElementById('submit-btn').style.display = 'none';
            document.getElementById('next-btn').style.display = 'block';
            document.getElementById('hint-btn').disabled = true;
        } else {
            this.attempts++;
            this.updateGameInfo();
            
            const missing = this.setDifference(this.validMoves, userMoves);
            const extra = this.setDifference(userMoves, this.validMoves);
            
            let errorMsg = `Incorrect! (Attempt ${this.attempts}/${this.maxAttempts})`;
            if (missing.size > 0) {
                errorMsg += ` Missing: ${Array.from(missing).sort().join(', ').toUpperCase()}.`;
            }
            if (extra.size > 0) {
                errorMsg += ` Extra: ${Array.from(extra).sort().join(', ').toUpperCase()}.`;
            }
            
            feedback.textContent = errorMsg;
            feedback.className = 'feedback error';
            
            if (this.attempts >= this.maxAttempts) {
                this.totalAttempts++;
                this.updateStats();
                document.getElementById('hint-btn').disabled = false;
            }
        }
    }

    checkPathAnswer(feedback) {
        if (this.pathMoves.length === 0) {
            feedback.textContent = 'Please select your moves!';
            feedback.className = 'feedback error';
            return;
        }

        const startSquare = this.coordsToSquare(this.piecePosition[0], this.piecePosition[1]);
        const targetSquare = this.coordsToSquare(this.targetPosition[0], this.targetPosition[1]);

        if (this.pathMoves.length > 3) {
            this.attempts++;
            feedback.textContent = `Too many moves! Use 3 or fewer. (Attempt ${this.attempts}/${this.maxAttempts})`;
            feedback.className = 'feedback error';
            
            if (this.attempts >= this.maxAttempts) {
                this.totalAttempts++;
                this.updateStats();
                document.getElementById('hint-btn').disabled = false;
            }
            return;
        }

        let currentPos = [this.piecePosition[0], this.piecePosition[1]];
        let isValidPath = true;

        for (const move of this.pathMoves) {
            const validMoves = this.getMoves(this.currentPiece, currentPos[0], currentPos[1]);
            if (!validMoves.has(move)) {
                isValidPath = false;
                break;
            }
            currentPos = this.squareToCoords(move);
        }

        const reachesTarget = this.pathMoves[this.pathMoves.length - 1] === targetSquare;

        if (isValidPath && reachesTarget) {
            this.score++;
            this.totalAttempts++;
            this.updateStats();
            
            feedback.textContent = `Correct! Path: ${startSquare.toUpperCase()} → ${this.pathMoves.map(m => m.toUpperCase()).join(' → ')}`;
            feedback.className = 'feedback success';
            
            document.getElementById('submit-btn').style.display = 'none';
            document.getElementById('next-btn').style.display = 'block';
            document.getElementById('hint-btn').disabled = true;
        } else {
            this.attempts++;
            
            if (!isValidPath) {
                feedback.textContent = `Invalid move in your path! (Attempt ${this.attempts}/${this.maxAttempts})`;
            } else {
                feedback.textContent = `Path doesn't reach the target! (Attempt ${this.attempts}/${this.maxAttempts})`;
            }
            feedback.className = 'feedback error';
            
            if (this.attempts >= this.maxAttempts) {
                this.totalAttempts++;
                this.updateStats();
                document.getElementById('hint-btn').disabled = false;
            }
            
            this.updateGameInfo();
        }
    }

    showHint() {
        const feedback = document.getElementById('feedback');
        
        if (this.currentMode === 'movement') {
            const moves = Array.from(this.validMoves).sort().map(s => s.toUpperCase()).join(', ');
            feedback.textContent = `Valid moves: ${moves}`;
            feedback.className = 'feedback info';
            this.showValidMoves();
        } else {
            if (this.validPaths && this.validPaths.length > 0) {
                const path = this.validPaths[0];
                feedback.textContent = `Solution: ${path.map(s => s.toUpperCase()).join(' → ')}`;
                feedback.className = 'feedback info';
            }
        }
        
        document.getElementById('submit-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'block';
    }

    showValidMoves() {
        for (const move of this.validMoves) {
            const [row, col] = this.squareToCoords(move);
            const square = document.querySelector(
                `.square[data-row="${row}"][data-col="${col}"]`
            );
            if (square) {
                square.classList.add('highlight');
            }
        }
    }

    nextPuzzle() {
        this.startGame();
    }

    quitGame() {
        clearInterval(this.timerInterval);
        this.createBoard();
        this.showScreen('menu-screen');
    }

    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('total').textContent = this.totalAttempts;
        const accuracy = this.totalAttempts > 0 
            ? Math.round((this.score / this.totalAttempts) * 100) 
            : 0;
        document.getElementById('accuracy').textContent = accuracy;
    }

    setsEqual(a, b) {
        if (a.size !== b.size) return false;
        for (const item of a) {
            if (!b.has(item)) return false;
        }
        return true;
    }

    setDifference(a, b) {
        const diff = new Set();
        for (const item of a) {
            if (!b.has(item)) diff.add(item);
        }
        return diff;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChessTrainer();
});
