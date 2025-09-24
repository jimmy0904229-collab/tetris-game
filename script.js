// 遊戲常數
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 20;

// 遊戲變數
let canvas, ctx;
let board = [];
let currentPiece = null;
let gameRunning = false;
let score = 0;
let level = 1;
let lines = 0;
let dropTime = 0;
let dropInterval = 1000;

// 方塊類型定義
const PIECES = [
    // I 型 (青色)
    {
        shape: [
            [1, 1, 1, 1]
        ],
        color: '#00ffff'
    },
    // O 型 (黃色)
    {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffff00'
    },
    // T 型 (紫色)
    {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#ff00ff'
    },
    // S 型 (綠色)
    {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00ff00'
    },
    // Z 型 (紅色)
    {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#ff0000'
    },
    // J 型 (藍色)
    {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#0000ff'
    },
    // L 型 (橙色)
    {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#ff7f00'
    }
];

// 初始化遊戲
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 初始化遊戲板
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }
    
    // 設置事件監聽器
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    
    // 開始遊戲
    startGame();
}

// 開始遊戲
function startGame() {
    gameRunning = true;
    score = 0;
    level = 1;
    lines = 0;
    dropTime = 0;
    dropInterval = 1000;
    
    // 清空遊戲板
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }
    
    // 隱藏遊戲結束畫面
    document.getElementById('gameOver').style.display = 'none';
    
    // 產生第一個方塊
    spawnPiece();
    
    // 更新顯示
    updateDisplay();
    
    // 開始遊戲迴圈
    gameLoop();
}

// 重新開始遊戲
function restartGame() {
    startGame();
}

// 產生新方塊
function spawnPiece() {
    const pieceType = Math.floor(Math.random() * PIECES.length);
    currentPiece = {
        shape: JSON.parse(JSON.stringify(PIECES[pieceType].shape)), // 深拷貝
        color: PIECES[pieceType].color,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0
    };
    
    // 檢查遊戲是否結束
    if (isCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver();
    }
}

// 碰撞檢測
function isCollision(x, y, shape) {
    for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
            if (shape[py][px] !== 0) {
                const newX = x + px;
                const newY = y + py;
                
                // 檢查邊界
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }
                
                // 檢查與已存在方塊的碰撞
                if (newY >= 0 && board[newY][newX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 固定方塊到遊戲板
function placePiece() {
    for (let py = 0; py < currentPiece.shape.length; py++) {
        for (let px = 0; px < currentPiece.shape[py].length; px++) {
            if (currentPiece.shape[py][px] !== 0) {
                const x = currentPiece.x + px;
                const y = currentPiece.y + py;
                if (y >= 0) {
                    board[y][x] = currentPiece.color;
                }
            }
        }
    }
}

// 清除滿行
function clearLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        let isFull = true;
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] === 0) {
                isFull = false;
                break;
            }
        }
        
        if (isFull) {
            // 移除這一行
            board.splice(y, 1);
            // 在頂部添加新的空行
            board.unshift(new Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++; // 重新檢查這一行
        }
    }
    
    if (linesCleared > 0) {
        // 計算分數
        const baseScore = [0, 40, 100, 300, 1200];
        score += baseScore[linesCleared] * level;
        lines += linesCleared;
        
        // 升級
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(50, 1000 - (level - 1) * 50);
        
        updateDisplay();
    }
}

// 旋轉方塊
function rotatePiece() {
    if (!currentPiece) return;
    
    const rotated = [];
    const shape = currentPiece.shape;
    const rows = shape.length;
    const cols = shape[0].length;
    
    for (let i = 0; i < cols; i++) {
        rotated[i] = [];
        for (let j = 0; j < rows; j++) {
            rotated[i][j] = shape[rows - 1 - j][i];
        }
    }
    
    if (!isCollision(currentPiece.x, currentPiece.y, rotated)) {
        currentPiece.shape = rotated;
    }
}

// 移動方塊
function movePiece(dx, dy) {
    if (!currentPiece) return;
    
    if (!isCollision(currentPiece.x + dx, currentPiece.y + dy, currentPiece.shape)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    return false;
}

// 鍵盤控制
function handleKeyPress(event) {
    if (!gameRunning) return;
    
    switch(event.keyCode) {
        case 37: // 左箭頭
            event.preventDefault();
            movePiece(-1, 0);
            break;
        case 39: // 右箭頭
            event.preventDefault();
            movePiece(1, 0);
            break;
        case 40: // 下箭頭
            event.preventDefault();
            if (!movePiece(0, 1)) {
                placePiece();
                clearLines();
                spawnPiece();
            }
            break;
        case 38: // 上箭頭
            event.preventDefault();
            rotatePiece();
            break;
    }
}

// 更新顯示
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// 繪製遊戲
function draw() {
    // 清空畫布
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 繪製網格
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // 繪製已固定的方塊
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] !== 0) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, 
                           BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            }
        }
    }
    
    // 繪製當前方塊
    if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        for (let py = 0; py < currentPiece.shape.length; py++) {
            for (let px = 0; px < currentPiece.shape[py].length; px++) {
                if (currentPiece.shape[py][px] !== 0) {
                    const x = (currentPiece.x + px) * BLOCK_SIZE;
                    const y = (currentPiece.y + py) * BLOCK_SIZE;
                    ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                }
            }
        }
    }
}

// 遊戲結束
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'flex';
}

// 遊戲主迴圈
function gameLoop() {
    if (!gameRunning) return;
    
    dropTime += 16; // 假設每16ms執行一次
    
    if (dropTime >= dropInterval) {
        if (!movePiece(0, 1)) {
            placePiece();
            clearLines();
            spawnPiece();
        }
        dropTime = 0;
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// 當頁面載入完成後初始化遊戲
window.addEventListener('load', initGame);