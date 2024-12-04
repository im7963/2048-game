class Game2048 {
    constructor(gridSize = 4) {
        this.gridSize = gridSize;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.moveHistory = [];
        this.maxUndoSteps = 10;
        this.initGrid();
        this.setupEventListeners();
        this.initializeAds();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
        this.updateScores();
    }

    initGrid() {
        this.grid = Array.from({ length: this.gridSize }, () => 
            Array(this.gridSize).fill(0)
        );
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(e.key)) {
                e.preventDefault();
                this.saveState();
                
                switch(e.key) {
                    case 'ArrowUp':
                    case 'w':
                        this.move('up');
                        break;
                    case 'ArrowDown':
                    case 's':
                        this.move('down');
                        break;
                    case 'ArrowLeft':
                    case 'a':
                        this.move('left');
                        break;
                    case 'ArrowRight':
                    case 'd':
                        this.move('right');
                        break;
                }
            }
        });

        // Touch controls
        let touchStartX, touchStartY;
        const gameContainer = document.querySelector('.game-container');

        gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        gameContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        gameContainer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
                this.saveState();
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    deltaX > 0 ? this.move('right') : this.move('left');
                } else {
                    deltaY > 0 ? this.move('down') : this.move('up');
                }
            }
        });

        // Button controls
        document.getElementById('new-game').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('undo').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('retry').addEventListener('click', () => {
            this.resetGame();
        });
    }

    initializeAds() {
        // Initialize your ad platform here
        // Example with Google AdSense
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.log('Ad blocker detected');
        }
    }

    saveState() {
        const state = {
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score
        };
        this.moveHistory.push(state);
        if (this.moveHistory.length > this.maxUndoSteps) {
            this.moveHistory.shift();
        }
    }

    undo() {
        if (this.moveHistory.length > 0) {
            const previousState = this.moveHistory.pop();
            this.grid = previousState.grid;
            this.score = previousState.score;
            this.renderGrid();
            this.updateScores();
        }
    }

    move(direction) {
        let moved = false;
        const rotatedGrid = this.rotateGrid(direction);
        
        for (let r = 0; r < this.gridSize; r++) {
            const row = rotatedGrid[r].filter(val => val !== 0);
            
            for (let c = 0; c < row.length - 1; c++) {
                if (row[c] === row[c + 1]) {
                    row[c] *= 2;
                    this.score += row[c];
                    row.splice(c + 1, 1);
                    moved = true;
                }
            }
            
            while (row.length < this.gridSize) {
                row.push(0);
            }
            
            if (JSON.stringify(rotatedGrid[r]) !== JSON.stringify(row)) {
                moved = true;
            }
            rotatedGrid[r] = row;
        }
        
        this.grid = this.unrotateGrid(rotatedGrid, direction);
        
        if (moved) {
            this.addRandomTile();
            this.renderGrid();
            this.updateScores();
            this.checkGameOver();
        }

        // Track move in analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'move', {
                'event_category': 'game',
                'event_label': direction
            });
        }
    }

    rotateGrid(direction) {
        let rotated = JSON.parse(JSON.stringify(this.grid));
        
        switch(direction) {
            case 'left':
                return rotated;
            case 'right':
                return rotated.map(row => row.reverse());
            case 'up':
                return rotated[0].map((_, colIndex) => 
                    rotated.map(row => row[colIndex])
                );
            case 'down':
                return rotated[0].map((_, colIndex) => 
                    rotated.map(row => row[colIndex]).reverse()
                );
        }
    }

    unrotateGrid(rotatedGrid, direction) {
        switch(direction) {
            case 'left':
                return rotatedGrid;
            case 'right':
                return rotatedGrid.map(row => row.reverse());
            case 'up':
                return rotatedGrid[0].map((_, colIndex) => 
                    rotatedGrid.map(row => row[colIndex])
                );
            case 'down':
                return rotatedGrid[0].map((_, colIndex) => 
                    rotatedGrid.map(row => row[colIndex]).reverse()
                );
        }
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
            return { row: r, col: c, value: this.grid[r][c] };
        }
        return null;
    }

    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const tileValue = this.grid[r][c];
                const tileElement = document.createElement('div');
                tileElement.classList.add('tile');
                
                if (tileValue !== 0) {
                    tileElement.textContent = tileValue;
                    tileElement.classList.add(`tile-${tileValue}`);
                    
                    // Add animation classes
                    if (this.isNewTile(r, c)) {
                        tileElement.classList.add('new');
                    } else if (this.isMergedTile(r, c)) {
                        tileElement.classList.add('merge');
                    }
                }
                
                gridElement.appendChild(tileElement);
            }
        }
    }

    isNewTile(row, col) {
        // Implementation for checking if a tile is new
        return false; // Placeholder
    }

    isMergedTile(row, col) {
        // Implementation for checking if a tile was merged
        return false; // Placeholder
    }

    updateScores() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
        document.getElementById('best-score').textContent = this.bestScore;
    }

    checkGameOver() {
        // Check if there are any empty cells
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }

        // Check if there are any possible merges
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const current = this.grid[r][c];
                // Check right
                if (c < this.gridSize - 1 && current === this.grid[r][c + 1]) return false;
                // Check down
                if (r < this.gridSize - 1 && current === this.grid[r + 1][c]) return false;
            }
        }

        this.gameOver();
        return true;
    }

    gameOver() {
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
        
        // Track game over in analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_over', {
                'event_category': 'game',
                'event_label': 'score',
                'value': this.score
            });
        }
    }

    resetGame() {
        this.grid = [];
        this.score = 0;
        this.moveHistory = [];
        this.initGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
        this.updateScores();
        document.getElementById('game-over').classList.add('hidden');

        // Track new game in analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'new_game', {
                'event_category': 'game'
            });
        }
    }
}

// Social sharing functions
function shareScore(platform) {
    const score = document.getElementById('score').textContent;
    const text = `I scored ${score} points in 2048 Pro! Can you beat my score?`;
    const url = encodeURIComponent(window.location.href);

    let shareUrl;
    switch(platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(text)}`;
            break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');

    // Track share in analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
            'event_category': 'social',
            'event_label': platform
        });
    }
}

// Modal functions
function showPrivacyPolicy() {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal-text').innerHTML = `
        <h2>Privacy Policy</h2>
        <p>This game collects anonymous usage data to improve the gaming experience...</p>
    `;
}

function showTerms() {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal-text').innerHTML = `
        <h2>Terms of Use</h2>
        <p>By using this game, you agree to...</p>
    `;
}

function showContact() {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal-text').innerHTML = `
        <h2>Contact Us</h2>
        <p>For support or business inquiries: support@2048pro.com</p>
    `;
}

// Close modal
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
