let deck = [];
let playerHand = [];
let dealerHand = [];
let bet = 0;
let balance = 0;
let gameActive = false;

const email = localStorage.getItem('casino_email');

function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = [
        {name: 'A', value: 11},
        {name: '2', value: 2},
        {name: '3', value: 3},
        {name: '4', value: 4},
        {name: '5', value: 5},
        {name: '6', value: 6},
        {name: '7', value: 7},
        {name: '8', value: 8},
        {name: '9', value: 9},
        {name: '10', value: 10},
        {name: 'J', value: 10},
        {name: 'Q', value: 10},
        {name: 'K', value: 10}
    ];
    let d = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            d.push({suit: suit, name: rank.name, value: rank.value});
        }
    }
    // シャッフル
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

function handValue(hand) {
    let total = 0;
    let aces = 0;
    for (let card of hand) {
        total += card.value;
        if (card.name === 'A') aces++;
    }
    // Aを1にする調整
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function renderHand(hand, elem, hideFirst = false) {
    elem.innerHTML = '';
    hand.forEach((card, idx) => {
        const div = document.createElement('div');
        div.className = 'bj-card';
        if (hideFirst && idx === 0) {
            div.textContent = '🂠';
        } else {
            div.textContent = card.name + card.suit;
        }
        elem.appendChild(div);
    });
}

function updateScores(showDealer = false) {
    const playerScore = handValue(playerHand);
    document.getElementById('player-score').textContent = `合計: ${playerScore}`;
    if (showDealer) {
        const dealerScore = handValue(dealerHand);
        document.getElementById('dealer-score').textContent = `合計: ${dealerScore}`;
    } else {
        document.getElementById('dealer-score').textContent = '';
    }
}

async function fetchBalance() {
    if (!email) return 0;
    const params = new URLSearchParams({
        email: email,
        action: 'getBalance'
    });
    const response = await fetch(`${GAS_URL}?${params.toString()}`);
    const data = await response.json();
    return data.balance || 0;
}

async function saveBalance(newBalance) {
    if (!email) return;
    const params = new URLSearchParams({
        email: email,
        balance: newBalance,
        action: 'updateBalance'
    });
    await fetch(`${GAS_URL}?${params.toString()}`);
}

function setBalance(val) {
    balance = val;
    document.querySelector('.balance').textContent = `残高: ¥${balance}`;
}

function setResult(msg, winAmount = null) {
    if (winAmount !== null) {
        if (winAmount > bet) {
            msg += ` (+¥${winAmount - bet})`;
        } else if (winAmount === bet) {
            msg += ` (ベット返却)`;
        } else {
            msg += ` (-¥${bet})`;
        }
    }
    document.getElementById('bj-result').textContent = msg;
}

function enableActions(hit, stand, betBtn, newGame) {
    document.getElementById('bj-hit-btn').disabled = !hit;
    document.getElementById('bj-stand-btn').disabled = !stand;
    document.getElementById('bj-bet-btn').disabled = !betBtn;
    document.getElementById('bj-newgame-btn').style.display = newGame ? '' : 'none';
}

function resetTable() {
    playerHand = [];
    dealerHand = [];
    setResult('');
    renderHand([], document.getElementById('player-cards'));
    renderHand([], document.getElementById('dealer-cards'));
    document.getElementById('player-score').textContent = '';
    document.getElementById('dealer-score').textContent = '';
}

async function startGame() {
    bet = parseInt(document.getElementById('bj-bet').value, 10);
    if (isNaN(bet) || bet < 1 || bet > balance) {
        setResult('正しいベット額を入力してください');
        return;
    }
    balance -= bet;
    await saveBalance(balance);
    setBalance(balance);

    deck = createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    gameActive = true;

    renderHand(playerHand, document.getElementById('player-cards'));
    renderHand(dealerHand, document.getElementById('dealer-cards'), true);
    updateScores(false);

    enableActions(true, true, false, false);

    // 21なら即終了
    if (handValue(playerHand) === 21) {
        await endGame();
    }
}

async function hit() {
    if (!gameActive) return;
    playerHand.push(deck.pop());
    renderHand(playerHand, document.getElementById('player-cards'));
    updateScores(false);

    const val = handValue(playerHand);
    if (val >= 21) {
        await endGame();
    }
}

async function stand() {
    if (!gameActive) return;
    // ディーラーターン
    while (handValue(dealerHand) < 17) {
        dealerHand.push(deck.pop());
    }
    await endGame();
}

async function endGame() {
    gameActive = false;
    renderHand(dealerHand, document.getElementById('dealer-cards'));
    updateScores(true);

    const playerVal = handValue(playerHand);
    const dealerVal = handValue(dealerHand);

    let msg = '';
    let win = 0;
    if (playerVal > 21) {
        msg = 'バースト！あなたの負け';
        setResult(msg, 0);
        // ★ここで残高チェックして自動チャージ
if (balance <= 0) {
  balance = 1000;
  msg.push('残高が0なので自動チャージ！+1000円');
}
    } else if (dealerVal > 21) {
        msg = 'ディーラーバースト！あなたの勝ち';
        win = bet * 2;
        balance += win;
        await saveBalance(balance);
        setBalance(balance);
        setResult(msg, win);
    } else if (playerVal === 21) { // 2枚以上でもOK
        msg = 'ブラックジャック！3倍獲得';
        win = bet * 3;
        balance += win;
        await saveBalance(balance);
        setBalance(balance);
        setResult(msg, win);
    } else if (playerVal > dealerVal) {
        msg = 'あなたの勝ち！';
        win = bet * 2;
        balance += win;
        await saveBalance(balance);
        setBalance(balance);
        setResult(msg, win);
    } else if (playerVal < dealerVal) {
        msg = 'あなたの負け';
        setResult(msg, 0);
        // ★ここで残高チェックして自動チャージ
if (balance <= 0) {
  balance = 1000;
  msg.push('残高が0なので自動チャージ！+1000円');
}
    } else {
        msg = '引き分け（プッシュ）';
        win = bet;
        balance += win;
        await saveBalance(balance);
        setBalance(balance);
        setResult(msg, win);
    }
    enableActions(false, false, false, true);
}

async function newGame() {
    resetTable();
    enableActions(false, false, true, false);
}

window.addEventListener('DOMContentLoaded', async () => {
    resetTable();
    enableActions(false, false, true, false);
    balance = await fetchBalance();
    setBalance(balance);

    document.getElementById('bj-bet-btn').addEventListener('click', startGame);
    document.getElementById('bj-hit-btn').addEventListener('click', hit);
    document.getElementById('bj-stand-btn').addEventListener('click', stand);
    document.getElementById('bj-newgame-btn').addEventListener('click', newGame);
    document.getElementById('bj-bet').addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1 || val > balance) {
            e.target.setCustomValidity('正しいベット額を入力してください');
        } else {
            e.target.setCustomValidity('');
        }
    });
});
