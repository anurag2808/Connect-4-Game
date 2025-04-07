const ROW_COUNT = 6;
const COLUMN_COUNT = 7;
const SQUARESIZE = 100;
const RADIUS = SQUARESIZE / 2 - 10;
const WIDTH = COLUMN_COUNT * SQUARESIZE;
const HEIGHT = (ROW_COUNT + 1) * SQUARESIZE;

const PLAYER = 1;
const AI = 2;
const EMPTY = 0;
const WINDOW_LENGTH = 4;

// Difficulty Levels
const EASY_DEPTH = 1;
const MEDIUM_DEPTH = 3;
const HARD_DEPTH = 5;
let ai_depth = MEDIUM_DEPTH;

// Initialize Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Message Display
const messageDiv = document.getElementById('message');

// Main Menu and Game Container
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');

// Difficulty Buttons
const easyBtn = document.getElementById('easy');
const mediumBtn = document.getElementById('medium');
const hardBtn = document.getElementById('hard');

// Restart Button
const restartBtn = document.getElementById('restart-button');

// Event Listeners for Difficulty Buttons
easyBtn.addEventListener('click', () => {
    ai_depth = EASY_DEPTH;
    startGame();
});

mediumBtn.addEventListener('click', () => {
    ai_depth = MEDIUM_DEPTH;
    startGame();
});

hardBtn.addEventListener('click', () => {
    ai_depth = HARD_DEPTH;
    startGame();
});

// Event Listener for Restart Button
restartBtn.addEventListener('click', () => {
    resetGame();
});

// Create Board
function createBoard() {
    const board = [];
    for (let r = 0; r < ROW_COUNT; r++) {
        board.push(Array(COLUMN_COUNT).fill(EMPTY));
    }
    return board;
}

// Drop Piece
function dropPiece(board, row, col, piece) {
    board[row][col] = piece;
}

// Check Valid Location
function isValidLocation(board, col) {
    return board[0][col] === EMPTY;
}

// Get Next Open Row
function getNextOpenRow(board, col) {
    for (let r = ROW_COUNT - 1; r >= 0; r--) {
        if (board[r][col] === EMPTY) {
            return r;
        }
    }
    return null;
}

// Winning Move
function winningMove(board, piece) {
    // Horizontal
    for (let r = 0; r < ROW_COUNT; r++) {
        for (let c = 0; c < COLUMN_COUNT - 3; c++) {
            if (board[r][c] === piece &&
                board[r][c + 1] === piece &&
                board[r][c + 2] === piece &&
                board[r][c + 3] === piece) {
                return true;
            }
        }
    }
    // Vertical
    for (let c = 0; c < COLUMN_COUNT; c++) {
        for (let r = 0; r < ROW_COUNT - 3; r++) {
            if (board[r][c] === piece &&
                board[r + 1][c] === piece &&
                board[r + 2][c] === piece &&
                board[r + 3][c] === piece) {
                return true;
            }
        }
    }
    // Positive Diagonal
    for (let r = 0; r < ROW_COUNT - 3; r++) {
        for (let c = 0; c < COLUMN_COUNT - 3; c++) {
            if (board[r][c] === piece &&
                board[r + 1][c + 1] === piece &&
                board[r + 2][c + 2] === piece &&
                board[r + 3][c + 3] === piece) {
                return true;
            }
        }
    }
    // Negative Diagonal
    for (let r = 3; r < ROW_COUNT; r++) {
        for (let c = 0; c < COLUMN_COUNT - 3; c++) {
            if (board[r][c] === piece &&
                board[r - 1][c + 1] === piece &&
                board[r - 2][c + 2] === piece &&
                board[r - 3][c + 3] === piece) {
                return true;
            }
        }
    }
    return false;
}

// Get Valid Locations
function getValidLocations(board) {
    const validLocations = [];
    for (let c = 0; c < COLUMN_COUNT; c++) {
        if (isValidLocation(board, c)) {
            validLocations.push(c);
        }
    }
    return validLocations;
}

// Check Terminal Node
function isTerminalNode(board) {
    return winningMove(board, PLAYER) || winningMove(board, AI) || getValidLocations(board).length === 0;
}
// Scoring Function to Evaluate Board
function scorePosition(board, piece) {
    let score = 0;

    // Score Center Column (AI prefers the center)
    const centerArray = [];
    for (let r = 0; r < ROW_COUNT; r++) {
        centerArray.push(board[r][Math.floor(COLUMN_COUNT / 2)]);
    }
    const centerCount = centerArray.filter(c => c === piece).length;
    score += centerCount * 3;

    // Score Horizontal
    for (let r = 0; r < ROW_COUNT; r++) {
        const rowArray = board[r];
        for (let c = 0; c < COLUMN_COUNT - 3; c++) {
            const window = rowArray.slice(c, c + WINDOW_LENGTH);
            score += evaluateWindow(window, piece);
        }
    }

    // Score Vertical
    for (let c = 0; c < COLUMN_COUNT; c++) {
        const colArray = [];
        for (let r = 0; r < ROW_COUNT; r++) {
            colArray.push(board[r][c]);
        }
        for (let r = 0; r < ROW_COUNT - 3; r++) {
            const window = colArray.slice(r, r + WINDOW_LENGTH);
            score += evaluateWindow(window, piece);
        }
    }

    // Score Positive Diagonal
    for (let r = 0; r < ROW_COUNT - 3; r++) {
        for (let c = 0; c < COLUMN_COUNT - 3; c++) {
            const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
            score += evaluateWindow(window, piece);
        }
    }

    // Score Negative Diagonal
    for (let r = 0; r < ROW_COUNT - 3; r++) {
        for (let c = 0; c < COLUMN_COUNT - 3; c++) {
            const window = [board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]];
            score += evaluateWindow(window, piece);
        }
    }

    return score;
}

// Evaluate Window (4 pieces in a row)
function evaluateWindow(window, piece) {
    let score = 0;
    const opponentPiece = piece === PLAYER ? AI : PLAYER;
    const pieceCount = window.filter(x => x === piece).length;
    const emptyCount = window.filter(x => x === EMPTY).length;
    const opponentCount = window.filter(x => x === opponentPiece).length;

    if (pieceCount === 4) {
        score += 100;
    } else if (pieceCount === 3 && emptyCount === 1) {
        score += 5;
    } else if (pieceCount === 2 && emptyCount === 2) {
        score += 2;
    }

    if (opponentCount === 3 && emptyCount === 1) {
        score -= 4;
    }

    return score;
}


// Minimax with Alpha-Beta Pruning
function minimax(board, depth, alpha, beta, maximizingPlayer) {
    const validLocations = getValidLocations(board);
    const isTerminal = isTerminalNode(board);
    if (depth === 0 || isTerminal) {
        if (isTerminal) {
            if (winningMove(board, AI)) {
                return { column: null, score: 100000000000 };
            } else if (winningMove(board, PLAYER)) {
                return { column: null, score: -100000000000 };
            } else {
                return { column: null, score: 0 };
            }
        } else {
            return { column: null, score: scorePosition(board, AI) };
        }
    }

    if (maximizingPlayer) {
        let value = -Infinity;
        let chosenColumn = validLocations[Math.floor(Math.random() * validLocations.length)];
        for (const col of validLocations) {
            const row = getNextOpenRow(board, col);
            const tempBoard = board.map(row => row.slice());
            dropPiece(tempBoard, row, col, AI);
            const newScore = minimax(tempBoard, depth - 1, alpha, beta, false).score;
            if (newScore > value) {
                value = newScore;
                chosenColumn = col;
            }
            alpha = Math.max(alpha, value);
            if (alpha >= beta) {
                break;
            }
        }
        return { column: chosenColumn, score: value };
    } else {
        let value = Infinity;
        let chosenColumn = validLocations[Math.floor(Math.random() * validLocations.length)];
        for (const col of validLocations) {
            const row = getNextOpenRow(board, col);
            const tempBoard = board.map(row => row.slice());
            dropPiece(tempBoard, row, col, PLAYER);
            const newScore = minimax(tempBoard, depth - 1, alpha, beta, true).score;
            if (newScore < value) {
                value = newScore;
                chosenColumn = col;
            }
            beta = Math.min(beta, value);
            if (alpha >= beta) {
                break;
            }
        }
        return { column: chosenColumn, score: value };
    }
}

// Draw Board
function drawBoard(board) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#57606f';
    ctx.fillRect(0, SQUARESIZE, WIDTH, ROW_COUNT * SQUARESIZE);

    for (let c = 0; c < COLUMN_COUNT; c++) {
        for (let r = 0; r < ROW_COUNT; r++) {
            ctx.beginPath();
            ctx.arc(c * SQUARESIZE + SQUARESIZE / 2, (r + 1) * SQUARESIZE + SQUARESIZE / 2, RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.closePath();

            if (board[r][c] === PLAYER) {
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(c * SQUARESIZE + SQUARESIZE / 2, (r + 1) * SQUARESIZE + SQUARESIZE / 2, RADIUS, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
            } else if (board[r][c] === AI) {
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(c * SQUARESIZE + SQUARESIZE / 2, (r + 1) * SQUARESIZE + SQUARESIZE / 2, RADIUS, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// Initialize Game
let board;
let gameOver;
let turn;

function resetGame() {
    board = createBoard();
    gameOver = false;
    turn = Math.floor(Math.random() * 2) === 0 ? PLAYER : AI;
    messageDiv.innerText = `Turn: ${turn === PLAYER ? 'Player' : 'AI'}`;
    drawBoard(board);
    
    if (turn === AI) {
        setTimeout(aiMove, 500); // AI starts with a move after a delay
    } else {
        addClickEventListeners();
    }
}

// Add Click Event Listeners for Player's Turn
function addClickEventListeners() {
    canvas.addEventListener('click', handleClick);
}

function removeClickEventListeners() {
    canvas.removeEventListener('click', handleClick);
}

// Handle Click for Player's Turn
function handleClick(event) {
    const x = event.clientX - canvas.getBoundingClientRect().left;
    const col = Math.floor(x / SQUARESIZE);

    if (isValidLocation(board, col) && !gameOver) {
        const row = getNextOpenRow(board, col);
        dropPiece(board, row, col, PLAYER);
        drawBoard(board);

        if (winningMove(board, PLAYER)) {
            messageDiv.innerText = 'Player wins!';
            gameOver = true;
            removeClickEventListeners();
        } else if (getValidLocations(board).length === 0) {
            messageDiv.innerText = 'It\'s a tie!';
            gameOver = true;
            removeClickEventListeners();
        } else {
            removeClickEventListeners();
            turn = AI;
            messageDiv.innerText = 'Turn: AI';
            setTimeout(aiMove, 500); // Slight delay for AI move
        }
    }
}

// AI Move
function aiMove() {
    if (!gameOver) {
        const { column } = minimax(board, ai_depth, -Infinity, Infinity, true);
        const row = getNextOpenRow(board, column);
        dropPiece(board, row, column, AI);
        drawBoard(board);

        if (winningMove(board, AI)) {
            messageDiv.innerText = 'AI wins!';
            gameOver = true;
        } else if (getValidLocations(board).length === 0) {
            messageDiv.innerText = 'It\'s a tie!';
            gameOver = true;
        } else {
            turn = PLAYER;
            messageDiv.innerText = 'Turn: Player';
            addClickEventListeners(); // Re-enable click event for player's next turn
        }
    }
}

// Start Game
function startGame() {
    mainMenu.style.display = 'none';
    gameContainer.style.display = 'block';
    resetGame();
}
