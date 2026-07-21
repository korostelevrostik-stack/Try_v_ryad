// ================================================================
//  game2.js — ЧАСТЬ 2: АНИМАЦИИ + БОНУСЫ + КНОПКИ
// ================================================================

function processMatches() {
    let matches = getMatches();
    if (matches.length === 0) {
        isProcessing = false;
        selected = null;
        return;
    }

    comboCount++;
    let points = 0;
    let bonusMap = new Map();
    let cellsToRemove = [];

    matches.forEach(group => {
        let size = group.length;
        if (size >= 4) {
            let bonusType;
            if (size >= 6) bonusType = BONUS_TYPES.BOMB;
            else if (size >= 5) bonusType = BONUS_TYPES.RAINBOW;
            else bonusType = BONUS_TYPES.ROCKET;
            let mid = Math.floor(group.length / 2);
            let [r, c] = group[mid];
            bonusMap.set(r + ',' + c, bonusType);
            group.forEach(([r, c]) => {
                if (!bonusMap.has(r + ',' + c)) cellsToRemove.push([r, c]);
            });
        } else {
            group.forEach(([r, c]) => cellsToRemove.push([r, c]));
        }
        points += size;
    });

    if (comboCount > 1) {
        let bonusPoints = comboCount * 2;
        points += bonusPoints;
        showToast('🔥 Комбо x' + comboCount + '! +' + bonusPoints, false);
        document.getElementById('grid').classList.add('combo-flash');
        setTimeout(() => document.getElementById('grid').classList.remove('combo-flash'), 600);
    }

    score += points;
    document.getElementById('score').textContent = score;

    if (score > highScore) {
        highScore = score;
        document.getElementById('highScore').textContent = highScore;
        saveUserDataFull();
    }

    let config = getLevelConfig(level);
    if (score >= config.target) {
        let reward = 10 + Math.floor(level / 5) * 2;
        money += reward;
        level++;
        document.getElementById('moneyDisplay').textContent = money;
        saveUserDataFull();
        showToast('🎉 Уровень пройден! +' + reward + ' монет!', false);
        setTimeout(() => {
            document.getElementById('gameOver').classList.add('active');
            document.getElementById('goText').textContent = '🏆 ПОБЕДА!';
            document.getElementById('goText').className = 'go-text win';
            document.getElementById('goScore').textContent = '🎉 Уровень ' + (level - 1) + ' пройден!';
            document.getElementById('restartBtn').textContent = '▶ Следующий уровень';
        }, 300);
        isProcessing = false;
        return;
    }

    let delay = 0;
    cellsToRemove.forEach(([r, c]) => {
        let obs = getObstacle(r, c);
        let cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            setTimeout(() => {
                if (obs) {
                    cell.classList.add('obstacle-hit');
                    hitObstacle(r, c);
                } else {
                    cell.classList.add('removing');
                }
            }, delay);
            delay += 50;
        }
        if (!obs) {
            grid[r][c] = -1;
        }
    });

    bonusMap.forEach((type, key) => {
        let [r, c] = key.split(',').map(Number);
        if (!hasObstacle(r, c)) {
            grid[r][c] = type;
        }
    });

    setTimeout(() => {
        dropDownWithAnimation();
    }, delay + 200);
}

function dropDownWithAnimation() {
    let dropPositions = [];
    
    for (let c = 0; c < SIZE; c++) {
        let writeRow = SIZE - 1;
        for (let r = SIZE - 1; r >= 0; r--) {
            if (grid[r][c] !== -1) {
                if (writeRow !== r) {
                    grid[writeRow][c] = grid[r][c];
                    grid[r][c] = -1;
                    dropPositions.push({ row: writeRow, col: c });
                }
                writeRow--;
            }
        }
        for (let r = writeRow; r >= 0; r--) {
            grid[r][c] = Math.floor(Math.random() * EMOJIS.length);
            dropPositions.push({ row: r, col: c, new: true });
            if (Math.random() < 0.03 && r > 1 && !hasObstacle(r, c)) {
                grid[r][c] = [BONUS_TYPES.ROCKET, BONUS_TYPES.BOMB][Math.floor(Math.random() * 2)];
            }
        }
    }

    renderGrid();

    dropPositions.forEach(pos => {
        let cell = document.querySelector(`.cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            if (pos.new) {
                cell.classList.add('new-cell');
            } else {
                cell.classList.add('dropping');
            }
        }
    });

    setTimeout(() => {
        if (hasMatches()) {
            processMatches();
        } else {
            isProcessing = false;
            selected = null;
            checkGameOver();
        }
    }, 400);
}

function dropDown() {
    for (let c = 0; c < SIZE; c++) {
        let writeRow = SIZE - 1;
        for (let r = SIZE - 1; r >= 0; r--) {
            if (grid[r][c] !== -1) {
                grid[writeRow][c] = grid[r][c];
                if (writeRow !== r) grid[r][c] = -1;
                writeRow--;
            }
        }
        for (let r = writeRow; r >= 0; r--) {
            grid[r][c] = Math.floor(Math.random() * EMOJIS.length);
            if (Math.random() < 0.03 && r > 1 && !hasObstacle(r, c)) {
                grid[r][c] = [BONUS_TYPES.ROCKET, BONUS_TYPES.BOMB][Math.floor(Math.random() * 2)];
            }
        }
    }
}

function checkGameOver() {
    let config = getLevelConfig(level);
    if (moves >= config.moves && score < config.target) {
        document.getElementById('gameOver').classList.add('active');
        document.getElementById('goText').textContent = '💀 ПОРАЖЕНИЕ';
        document.getElementById('goText').className = 'go-text';
        document.getElementById('goScore').textContent = 'Очки: ' + score + ' / ' + config.target;
        document.getElementById('restartBtn').textContent = '🔄 Попробовать снова';
        return;
    }
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (typeof grid[i][j] !== 'number') continue;
            let neighbors = [[0,1],[0,-1],[1,0],[-1,0]];
            for (let [di, dj] of neighbors) {
                let ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < SIZE && nj >= 0 && nj < SIZE) {
                    if (typeof grid[ni][nj] !== 'number') continue;
                    let temp = grid[i][j];
                    grid[i][j] = grid[ni][nj];
                    grid[ni][nj] = temp;
                    if (hasMatches()) {
                        grid[ni][nj] = grid[i][j];
                        grid[i][j] = temp;
                        return;
                    }
                    grid[ni][nj] = grid[i][j];
                    grid[i][j] = temp;
                }
            }
        }
    }
    showToast('🔄 Перемешивание...', false);
    setTimeout(() => {
        let flat = [];
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (typeof grid[i][j] === 'number') flat.push(grid[i][j]);
            }
        }
        for (let i = flat.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [flat[i], flat[j]] = [flat[j], flat[i]];
        }
        let idx = 0;
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (typeof grid[i][j] === 'number') {
                    grid[i][j] = flat[idx++];
                }
            }
        }
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (typeof grid[i][j] !== 'number') grid[i][j] = Math.floor(Math.random() * EMOJIS.length);
            }
        }
        renderGrid();
        isProcessing = false;
        selected = null;
        showToast('🔄 Перемешано!', false);
    }, 600);
}

function activateBonus(row, col) {
    let bonus = grid[row][col];
    if (bonus === BONUS_TYPES.ROCKET) {
        showToast('🚀 Ракета!', false);
        for (let i = 0; i < SIZE; i++) {
            if (typeof grid[row][i] === 'number') { grid[row][i] = -1; score += 2; }
            if (hasObstacle(row, i)) hitObstacle(row, i);
        }
        grid[row][col] = -1;
        document.getElementById('score').textContent = score;
        afterBonus();
    } else if (bonus === BONUS_TYPES.BOMB) {
        showToast('💣 Бомба!', false);
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                let nr = row + i, nc = col + j;
                if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
                    if (typeof grid[nr][nc] === 'number') { grid[nr][nc] = -1; score += 1; }
                    if (hasObstacle(nr, nc)) hitObstacle(nr, nc);
                }
            }
        }
        grid[row][col] = -1;
        document.getElementById('score').textContent = score;
        afterBonus();
    } else if (bonus === BONUS_TYPES.RAINBOW) {
        showToast('🌈 Радуга!', false);
        let targetType = Math.floor(Math.random() * EMOJIS.length);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (grid[i][j] === targetType) {
                    grid[i][j] = -1;
                    score += 3;
                    if (hasObstacle(i, j)) hitObstacle(i, j);
                }
            }
        }
        grid[row][col] = -1;
        document.getElementById('score').textContent = score;
        afterBonus();
    } else if (bonus === BONUS_TYPES.DOUBLE) {
        showToast('⚡ Двойные очки!', false);
        score += 10;
        document.getElementById('score').textContent = score;
        grid[row][col] = -1;
        afterBonus();
    }
}

function afterBonus() {
    renderGrid();
    setTimeout(() => {
        dropDownWithAnimation();
        setTimeout(() => {
            if (hasMatches()) {
                processMatches();
            } else {
                isProcessing = false;
                selected = null;
                checkGameOver();
            }
        }, 300);
    }, 300);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = moves;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('moneyDisplay').textContent = money;
    let user = getCurrentUser();
    if (user) document.getElementById('userName').textContent = user;
}

function showToast(msg, isError = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast' + (isError ? ' error' : '');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
}

function startGame() {
    let user = getCurrentUser();
    if (!user) {
        showAuthScreen();
        return;
    }
    currentUser = user;
    loadUserData();
    score = 0;
    moves = 0;
    selected = null;
    isProcessing = false;
    comboCount = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('moves').textContent = '0';
    document.getElementById('gameOver').classList.remove('active');
    document.getElementById('restartBtn').textContent = '🔄 Ещё раз';
    initGrid();
    renderGrid();
    document.getElementById('statusMsg').textContent = '🍎 Собирай комбинации! Уровень ' + level;
}

// ---- МАГАЗИН ----
function openShop() {
    document.getElementById('shopOverlay').classList.add('active');
    document.getElementById('shopMoney').textContent = money;
    let container = document.getElementById('shopItems');
    container.innerHTML = '';
    let items = [
        { id: 'rocket', name: '🚀 Ракета', desc: 'Взрывает ряд', cost: 30, owned: userBonuses.rocket },
        { id: 'bomb', name: '💣 Бомба', desc: 'Взрывает вокруг', cost: 50, owned: userBonuses.bomb },
        { id: 'rainbow', name: '🌈 Радуга', desc: 'Удаляет один тип', cost: 80, owned: userBonuses.rainbow },
        { id: 'double', name: '⚡ Двойные очки', desc: '+10 очков', cost: 40, owned: userBonuses.double }
    ];
    items.forEach(item => {
        let div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div class="info">
                <span class="name">${item.name}</span>
                <span class="desc">${item.desc}</span>
                <span class="owned">В наличии: ${item.owned}</span>
            </div>
            <button class="buy-btn ${money < item.cost ? 'disabled' : ''}" data-id="${item.id}" data-cost="${item.cost}">
                ${item.cost}💰
            </button>
        `;
        container.appendChild(div);
    });
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let id = this.dataset.id;
            let cost = parseInt(this.dataset.cost);
            if (money < cost) { showToast('⚠️ Не хватает монет!', true); return; }
            money -= cost;
            userBonuses[id] = (userBonuses[id] || 0) + 1;
            document.getElementById('moneyDisplay').textContent = money;
            saveUserDataFull();
            openShop();
            showToast('✅ Куплено!', false);
        });
    });
}

// ---- КНОПКИ ----
document.addEventListener('DOMContentLoaded', function() {
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', function() {
            if (isProcessing) return;
            if (confirm('Начать новую игру?')) {
                score = 0;
                moves = 0;
                selected = null;
                isProcessing = false;
                document.getElementById('gameOver').classList.remove('active');
                initGrid();
                renderGrid();
                showToast('🔄 Новая игра!', false);
            }
        });
    }

    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', function() {
            if (isProcessing) return;
            initGrid();
            renderGrid();
            showToast('🔄 Перемешано!', false);
        });
    }

    const shopBtn = document.getElementById('shopBtn');
    if (shopBtn) {
        shopBtn.addEventListener('click', openShop);
    }

    const shopClose = document.getElementById('shopClose');
    if (shopClose) {
        shopClose.addEventListener('click', function() {
            document.getElementById('shopOverlay').classList.remove('active');
        });
    }

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            document.getElementById('gameOver').classList.remove('active');
            startGame();
        });
    }

    document.getElementById('shopOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });

    console.log('✅ Все кнопки зарегистрированы!');
});

console.log('🎮 game2.js загружен!');
