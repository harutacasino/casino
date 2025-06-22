let balance = 0;
let bet = 0;
let bombs = 3;
let board = [];
let opened = [];
let gameActive = false;
let pickedCount = 0;
let multiplier = 1.0;
let bombPositions = [];
const BOARD_SIZE = 5;

const balanceElem = document.getElementById('mines-balance');
const betElem = document.getElementById('mines-bet');
const bombsElem = document.getElementById('mines-bombs');
const startBtn = document.getElementById('mines-start-btn');
const cashoutBtn = document.getElementById('mines-cashout-btn');
const boardElem = document.getElementById('mines-board');
const pickedElem = document.getElementById('mines-picked');
const multiplierElem = document.getElementById('mines-multiplier');
const resultElem = document.getElementById('mines-result');

async function fetchBalance() {
    const email = localStorage.getItem('casino_email');
    if (!email) return 0;
    const params = new URLSearchParams({
        email: email,
        action: 'getBalance'
    });
    const response = await fetch(`${GAS_URL}?${params.toString()}`);
    const data = await response.json();
    return data.balance ? Number(data.balance) : 0;
}

async function saveBalance(newBalance) {
    const email = localStorage.getItem('casino_email');
    if (!email) return;
    const params = new URLSearchParams({
        email: email,
        balance: newBalance,
        action: 'updateBalance'
    });
    await fetch(`${GAS_URL}?${params.toString()}`);
}

function updateBalanceDisplay() {
    balanceElem.textContent = balance;
    if (document.querySelector('.balance')) {
        document.querySelector('.balance').innerHTML = `残高: <span id="mines-balance">${balance}</span>円`;
    }
}

function resetBoard() {
    board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
    opened = Array(BOARD_SIZE * BOARD_SIZE).fill(false);
    bombPositions = [];
    pickedCount = 0;
    multiplier = 1.0;
    updateInfo();
    boardElem.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'mines-cell';
        cell.dataset.idx = i;
        cell.textContent = '';
        boardElem.appendChild(cell);
    }
}

function updateInfo() {
    pickedElem.textContent = `開けたマス: ${pickedCount}`;
    multiplierElem.textContent = `倍率: ${multiplier.toFixed(2)}x`;
    // 利益表示を追加
    if (pickedCount > 0 && gameActive) {
        const profit = Math.floor(bet * multiplier) - bet;
        resultElem.textContent = `現在の利益: +${profit}円`;
    } else if (!gameActive) {
        // ゲーム終了時は何もしない（endGame/loseGameで上書きされる）
    } else {
        resultElem.textContent = '';
    }
}

function getMultiplier(picked, bombs) {
    // Stake風の倍率テーブル（5x5, 5bombs例）
    const table = [1.14, 1.31, 1.53, 1.81, 2.15, 2.57, 3.09, 3.73, 4.53, 5.53, 6.78, 8.36, 10.36, 12.89, 16.09, 20.13, 25.24, 31.77, 40.14, 50.88];
    if (picked === 0) return 1.00;
    if (picked <= table.length) return table[picked - 1];
    return table[table.length - 1];
}

function placeBombs() {
    bombPositions = [];
    let positions = Array.from({length: BOARD_SIZE * BOARD_SIZE}, (_, i) => i);
    for (let i = 0; i < bombs; i++) {
        const idx = Math.floor(Math.random() * positions.length);
        bombPositions.push(positions[idx]);
        positions.splice(idx, 1);
    }
}

function revealAllBombs() {
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        if (bombPositions.includes(i)) {
            const cell = boardElem.children[i];
            cell.classList.add('bomb', 'open');
            cell.textContent = '💣';
        }
    }
}

function endGame(win) {
    gameActive = false;
    startBtn.disabled = false;
    cashoutBtn.disabled = true;
    Array.from(boardElem.children).forEach(cell => cell.style.pointerEvents = 'none');
    if (win) {
        const winAmount = Math.floor(bet * multiplier);
        // すでにベット額は引かれているので、払い戻しは「ベット額×倍率」
        balance += winAmount;
        saveBalance(balance);
        updateBalanceDisplay();
        resultElem.textContent = `キャッシュアウト成功！${winAmount}円払い戻し`;
    }
}

function loseGame() {
    gameActive = false;
    startBtn.disabled = false;
    cashoutBtn.disabled = true;
    revealAllBombs();
    Array.from(boardElem.children).forEach(cell => cell.style.pointerEvents = 'none');
    resultElem.textContent = '💥 爆弾！ゲームオーバー';
}

// ★共通：負けた後や残高が0の時に自動チャージ
    if (balance <= 0) {
        balance = 1000;
        await saveBalance(balance);
        setBalance(balance);
        document.getElementById('bj-result').textContent += ' / 残高が0なので自動チャージ(+¥1000)';
    }

function openCell(idx) {
    if (!gameActive || opened[idx]) return;
    const cell = boardElem.children[idx];
    if (bombPositions.includes(idx)) {
        cell.classList.add('bomb', 'open');
        cell.textContent = '💣';
        loseGame();
        return;
    }
    cell.classList.add('open');
    cell.textContent = '💎';
    opened[idx] = true;
    pickedCount++;
    multiplier = getMultiplier(pickedCount, bombs);
    updateInfo();
    if (pickedCount === BOARD_SIZE * BOARD_SIZE - bombs) {
        // 全部開けたら自動キャッシュアウト
        endGame(true);
    }
}

startBtn.addEventListener('click', async () => {
    bet = parseInt(betElem.value, 10);
    bombs = parseInt(bombsElem.value, 10);
    if (isNaN(bet) || bet < 10) {
        resultElem.textContent = 'ベット額は10円以上で入力してください';
        return;
    }
    if (bet > balance) {
        resultElem.textContent = '残高が足りません';
        return;
    }
    startBtn.disabled = true;
    cashoutBtn.disabled = false;
    resultElem.textContent = '';
    balance -= bet;
    await saveBalance(balance);
    updateBalanceDisplay();
    resetBoard();
    placeBombs();
    gameActive = true;
    Array.from(boardElem.children).forEach(cell => {
        cell.style.pointerEvents = 'auto';
        cell.addEventListener('click', () => {
            if (!gameActive) return;
            openCell(Number(cell.dataset.idx));
        }, { once: true });
    });
    updateInfo();
});

cashoutBtn.addEventListener('click', () => {
    if (!gameActive || pickedCount === 0) return;
    endGame(true);
});

bombsElem.addEventListener('change', () => {
    bombs = parseInt(bombsElem.value, 10);
    multiplier = getMultiplier(pickedCount, bombs);
    updateInfo();
});

window.addEventListener('DOMContentLoaded', async () => {
    resetBoard();
    balance = await fetchBalance();
    updateBalanceDisplay();
    updateInfo();
    startBtn.disabled = false;
    cashoutBtn.disabled = true;
});
