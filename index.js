const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Game state variables
let currentPlayer = 'X';
let boardState = Array(9).fill('');
let gameActive = true;
let selectedPiece = null;
// Track how many pieces each player has (max 3 per player)
let xCount = 0;
let oCount = 0;

// New game mode variables
let gameMode = 'two-player'; // 'two-player' or 'one-player'
let difficulty = 'medium'; // 'easy', 'medium', or 'hard'
let isComputerTurn = false;

const statusDisplay = document.getElementById('status');
const cells = document.querySelectorAll('.cell');
const resetBtn = document.getElementById('resetBtn');

// Screen elements
const modeScreen = document.getElementById('modeScreen');
const difficultyScreen = document.getElementById('difficultyScreen');
const gameScreen = document.getElementById('gameScreen');

// Mode buttons
const twoPlayerBtn = document.getElementById('twoPlayerBtn');
const onePlayerBtn = document.getElementById('onePlayerBtn');

// Difficulty buttons
const easyBtn = document.getElementById('easyBtn');
const mediumBtn = document.getElementById('mediumBtn');
const hardBtn = document.getElementById('hardBtn');

function getPieceCount(player) {
    return player === 'X' ? xCount : oCount;
}

function incrementPieceCount(player) {
    if (player === 'X') xCount++;
    else oCount++;
}

// Check if both players have placed 3 pieces each
function isMovePhase() {
    return xCount >= 3 && oCount >= 3;
}

function handleCellClick(event) {
    const cell = event.target;
    const cellIndex = parseInt(cell.getAttribute('data-cell-index'));

    // If it's computer's turn in one-player mode, ignore clicks
    if (gameMode === 'one-player' && isComputerTurn) return;
    
    if (!gameActive) return;

    // MOVE PHASE: when both players have placed their max pieces (3 each)
    if (isMovePhase()) {
        // If no piece selected yet, select one of our pieces to move
        if (selectedPiece === null) {
            const cellValue = boardState[cellIndex];
            
            if (cellValue === currentPlayer) {
                document.querySelector('.selected')?.classList.remove('selected');
                selectedPiece = cellIndex;
                cell.classList.add('selected');
                statusDisplay.textContent = `Move your ${currentPlayer}. Click an empty cell.`;
            }
            return;
        }

        // We have a selected piece - try to move it
        const cellValue = boardState[cellIndex];

        if (cellValue === '') {
            movePiece(selectedPiece, cellIndex);
            
            // Clear selection
            document.querySelector('.selected')?.classList.remove('selected');
            selectedPiece = null;
            
            // If in one-player mode, switch to computer turn
            if (gameMode === 'one-player') {
                isComputerTurn = true;
                setTimeout(computerMove, 500); // Add slight delay for better UX
            }
            return;
        }

        // Clicked on our own piece - resselect it (currently deselect)
        if (cellValue === currentPlayer) {
            return;
        }

        // Clicked on opponent piece - ignore for now, or could capture
        return;
    }

    // NORMAL PLACEMENT: player wants to place a new piece
    
    // Only allow placement if cell is empty and we haven't placed all 3 pieces yet
    if (boardState[cellIndex] !== '') {
        return;
    }

    const currentPieceCount = getPieceCount(currentPlayer);
    if (currentPieceCount >= 3) {
        // Player has already placed 3 pieces - cannot place more
        statusDisplay.textContent = `You have already placed ${currentPieceCount} pieces! Move them instead.`;
        return;
    }

    boardState[cellIndex] = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    cell.textContent = currentPlayer;
    
    // Increment piece counter for this player
    incrementPieceCount(currentPlayer);

    checkResult();
    
    // If in one-player mode, switch to computer turn
    if (gameMode === 'one-player' && gameActive) {
        isComputerTurn = true;
        setTimeout(computerMove, 500); // Add slight delay for better UX
    }
}

function movePiece(fromIndex, toIndex) {
    const fromCell = cells[fromIndex];
    const toCell = cells[toIndex];
    
    // Clear old position in boardState and DOM
    boardState[fromIndex] = '';
    fromCell.classList.remove(currentPlayer.toLowerCase());
    fromCell.textContent = '';
    
    // Set new position
    boardState[toIndex] = currentPlayer;
    toCell.classList.add(currentPlayer.toLowerCase());
    toCell.textContent = currentPlayer;
    
    checkResult();
}

function checkResult() {
    // Check ALL winning conditions for BOTH players (X and O)
    let winner = null;
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (boardState[a] && boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
            winner = boardState[a]; // 'X' or 'O'
            break;
        }
    }

    if (winner) {
        statusDisplay.textContent = `Player ${winner} wins!`;
        gameActive = false;
        return;
    }

    // Switch turns
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    
    // If we're in move phase (both players have 3+ pieces), enter selection mode
    if (isMovePhase()) {
        selectedPiece = null;
        statusDisplay.textContent = `Player ${currentPlayer}'s turn. Select one of your pieces to move.`;
        return;
    }

    // Not in move phase - just switch turns for normal placement
    statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
}

function resetGame() {
    currentPlayer = 'X';
    boardState = Array(9).fill('');
    gameActive = true;
    selectedPiece = null;
    xCount = 0;
    oCount = 0;
    isComputerTurn = false;
    statusDisplay.textContent = "Player X's turn";

    cells.forEach(cell => {
        cell.classList.remove('x', 'o', 'selected');
        cell.textContent = '';
    });
}

// New functions for game mode selection
function startTwoPlayerGame() {
    gameMode = 'two-player';
    modeScreen.classList.remove('active-screen');
    difficultyScreen.classList.remove('active-screen');
    gameScreen.classList.add('active-screen');
    resetGame();
}

function startOnePlayerGame() {
    gameMode = 'one-player';
    modeScreen.classList.remove('active-screen');
    difficultyScreen.classList.add('active-screen');
}

function selectDifficulty(difficultyLevel) {
    difficulty = difficultyLevel;
    difficultyScreen.classList.remove('active-screen');
    gameScreen.classList.add('active-screen');
    resetGame();
}

// Computer move functions
function computerMove() {
    if (!gameActive || !isComputerTurn) return;
    
    // If both players have placed 3 pieces, computer must move existing pieces
    if (isMovePhase()) {
        // Find all computer pieces (O's) that can be moved
        const computerPieces = [];
        boardState.forEach((cell, index) => {
            if (cell === 'O') computerPieces.push(index);
        });
        
        if (computerPieces.length === 0) {
            isComputerTurn = false;
            return;
        }
        
        // Select a random piece to move
        const fromIndex = computerPieces[Math.floor(Math.random() * computerPieces.length)];
        
        // Find all empty cells to move to
        const emptyCells = [];
        boardState.forEach((cell, index) => {
            if (cell === '') emptyCells.push(index);
        });
        
        if (emptyCells.length === 0) {
            isComputerTurn = false;
            return;
        }
        
        // Move to a random empty cell
        const toIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        // Make the move
        boardState[fromIndex] = '';
        boardState[toIndex] = 'O';
        
        const fromCell = cells[fromIndex];
        const toCell = cells[toIndex];
        
        fromCell.classList.remove('o');
        fromCell.textContent = '';
        
        toCell.classList.add('o');
        toCell.textContent = 'O';
        
        checkResult();
    } else {
        // Normal placement phase

        let moveIndex;
        
        switch(difficulty) {
            case 'easy':
                moveIndex = getRandomMove();
                break;
            case 'medium':
                moveIndex = getMediumMove();
                break;
            case 'hard':
                moveIndex = getBestMove();
                break;
            default:
                moveIndex = getRandomMove();
        }
        
        // Make the move
        boardState[moveIndex] = 'O';
        const cell = cells[moveIndex];
        cell.classList.add('o');
        cell.textContent = 'O';
        
        incrementPieceCount('O');
        
        checkResult();
    }
    
    // Switch back to player turn
    isComputerTurn = false;
}

// Easy difficulty - random move
function getRandomMove() {
    const emptyCells = [];
    boardState.forEach((cell, index) => {
        if (cell === '') emptyCells.push(index);
    });
    
    if (emptyCells.length === 0) return -1;
    
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// Medium difficulty - blocks winning moves, otherwise random
function getMediumMove() {
    // Check if computer can win
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (boardState[a] === 'O' && boardState[b] === 'O' && boardState[c] === '') return c;
        if (boardState[a] === 'O' && boardState[c] === 'O' && boardState[b] === '') return b;
        if (boardState[b] === 'O' && boardState[c] === 'O' && boardState[a] === '') return a;
    }
    
    // Check if player can win and block
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (boardState[a] === 'X' && boardState[b] === 'X' && boardState[c] === '') return c;
        if (boardState[a] === 'X' && boardState[c] === 'X' && boardState[b] === '') return b;
        if (boardState[b] === 'X' && boardState[c] === 'X' && boardState[a] === '') return a;
    }
    
    // Otherwise random
    return getRandomMove();
}

// Hard difficulty - minimax algorithm
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = 'O';
            let score = minimax(boardState, 0, false);
            boardState[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

// Minimax algorithm for hard difficulty
function minimax(board, depth, isMaximizing) {
    // Check for terminal states
    let winner = checkWinner(board);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (board.every(cell => cell !== '')) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Helper function to check winner
function checkWinner(board) {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Event listeners
twoPlayerBtn.addEventListener('click', startTwoPlayerGame);
onePlayerBtn.addEventListener('click', startOnePlayerGame);

easyBtn.addEventListener('click', () => selectDifficulty('easy'));
mediumBtn.addEventListener('click', () => selectDifficulty('medium'));
hardBtn.addEventListener('click', () => selectDifficulty('hard'));

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);