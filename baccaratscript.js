let balance = 0;
let timer = 5;
let intervalId = null;
let betLocked = false;
let selectedChip = 0;
let bets = { player: 0, banker: 0, tie: 0 };

const balanceElem = document.getElementById('baccarat-balance');
const playerCardsElem = document.getElementById('player-cards');
const bankerCardsElem = document.getElementById('banker-cards');
const playerScoreElem = document.getElementById('player-score');
const bankerScoreElem = document.getElementById('banker-score');
const resultElem = document.getElementById('baccarat-result');
const timerElem = document.getElementById('baccarat-timer');
const chipBtns = document.querySelectorAll('.baccarat-chip');
const playerBetArea = document.getElementById('player-bet-area');
const bankerBetArea = document.getElementById('banker-bet-area');
const tieBetArea = document.getElementById('tie-bet-area');
const playerBetElem = document.getElementById('player-bet');
const bankerBetElem = document.getElementById('banker-bet');
const tieBetElem = document.getElementById('tie-bet');
const historyElem = document.getElementById('baccarat-history');
let historyList = [];

// 合計ベット額表示
const totalBetElem = document.createElement('div');
totalBetElem.className = 'baccarat-totalbet';
document.querySelector('.baccarat-container').insertBefore(totalBetElem, document.querySelector('.baccarat-chips'));

function updateTotalBet() {
    const total = bets.player + bets.banker + bets.tie;
    totalBetElem.textContent = `このラウンドの合計ベット額: ${total}円`;
}

// GASから残高を取得
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

// GASに残高を保存
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
    // バナー残高も即時更新
    if (document.querySelector('.balance')) {
        document.querySelector('.balance').innerHTML = `残高: <span id="baccarat-balance">${balance}</span>円`;
    }
}

function resetCards() {
    playerCardsElem.innerHTML = `<div class="baccarat-card">?</div><div class="baccarat-card">?</div>`;
    bankerCardsElem.innerHTML = `<div class="baccarat-card">?</div><div class="baccarat-card">?</div>`;
    playerScoreElem.textContent = '';
    bankerScoreElem.textContent = '';
}

function resetBets() {
    bets = { player: 0, banker: 0, tie: 0 };
    playerBetElem.textContent = '';
    bankerBetElem.textContent = '';
    tieBetElem.textContent = '';
    [playerBetArea, bankerBetArea, tieBetArea].forEach(area => area.classList.remove('selected'));
    updateTotalBet();
}

function startTimer() {
    timer = 5;
    timerElem.textContent = timer;
    betLocked = false;
    resetBets();
    updateBalanceDisplay();
    intervalId = setInterval(() => {
        timer--;
        timerElem.textContent = timer;
        if (timer === 0) {
            clearInterval(intervalId);
            playRound();
        }
    }, 1000);
}

// バカラのカードを1枚引く
function drawCard() {
    const ranks = [1,2,3,4,5,6,7,8,9,10,11,12,13];
    const suits = ['♠','♥','♦','♣'];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return { rank, suit };
}

// バカラのカードの点数
function baccaratValue(card) {
    if (card.rank >= 10) return 0;
    return card.rank;
}

// バカラのスコア計算
function baccaratScore(cards) {
    let sum = cards.reduce((acc, c) => acc + baccaratValue(c), 0);
    return sum % 10;
}

// カード表示
function renderCards(cards, elem) {
    elem.innerHTML = '';
    cards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'baccarat-card';
        let rankText = card.rank;
        if (card.rank === 1) rankText = 'A';
        if (card.rank === 11) rankText = 'J';
        if (card.rank === 12) rankText = 'Q';
        if (card.rank === 13) rankText = 'K';
        div.textContent = rankText + card.suit;
        elem.appendChild(div);
    });
}

// カード表示（1枚ずつアニメーションで表示）
async function renderCardsStep(cards, elem, delay = 400) {
    elem.innerHTML = '';
    for (let i = 0; i < cards.length; i++) {
        await new Promise(res => setTimeout(res, delay));
        const div = document.createElement('div');
        div.className = 'baccarat-card';
        let rankText = cards[i].rank;
        if (cards[i].rank === 1) rankText = 'A';
        if (cards[i].rank === 11) rankText = 'J';
        if (cards[i].rank === 12) rankText = 'Q';
        if (cards[i].rank === 13) rankText = 'K';
        div.textContent = rankText + cards[i].suit;
        elem.appendChild(div);
    }
}

// カードを1枚ずつ追加表示
async function appendCard(card, elem, delay = 400) {
    await new Promise(res => setTimeout(res, delay));
    const div = document.createElement('div');
    div.className = 'baccarat-card';
    let rankText = card.rank;
    if (card.rank === 1) rankText = 'A';
    if (card.rank === 11) rankText = 'J';
    if (card.rank === 12) rankText = 'Q';
    if (card.rank === 13) rankText = 'K';
    div.textContent = rankText + card.suit;
    elem.appendChild(div);
}

async function playRound() {
    betLocked = true;
    // 2枚ずつ配る
    let player = [drawCard(), drawCard()];
    let banker = [drawCard(), drawCard()];

    // スコア計算
    let playerVal = baccaratScore(player);
    let bankerVal = baccaratScore(banker);

    // 3枚目ルール
    let playerDraws = false;
    let bankerDraws = false;
    let playerThird = null;
    let bankerThird = null;

    // プレイヤー3枚目
    if (playerVal <= 5) {
        playerThird = drawCard();
        player.push(playerThird);
        playerDraws = true;
        playerVal = baccaratScore(player);
    }

    // バンカー3枚目
    if (!playerDraws) {
        if (bankerVal <= 5) {
            bankerThird = drawCard();
            banker.push(bankerThird);
            bankerDraws = true;
            bankerVal = baccaratScore(banker);
        }
    } else {
        // バンカーの3枚目ルール（簡易化）
        if (bankerVal <= 2) {
            bankerThird = drawCard();
            banker.push(bankerThird);
            bankerDraws = true;
            bankerVal = baccaratScore(banker);
        } else if (bankerVal === 3 && baccaratValue(playerThird) !== 8) {
            bankerThird = drawCard();
            banker.push(bankerThird);
            bankerDraws = true;
            bankerVal = baccaratScore(banker);
        } else if (bankerVal === 4 && [2,3,4,5,6,7].includes(baccaratValue(playerThird))) {
            bankerThird = drawCard();
            banker.push(bankerThird);
            bankerDraws = true;
            bankerVal = baccaratScore(banker);
        } else if (bankerVal === 5 && [4,5,6,7].includes(baccaratValue(playerThird))) {
            bankerThird = drawCard();
            banker.push(bankerThird);
            bankerDraws = true;
            bankerVal = baccaratScore(banker);
        } else if (bankerVal === 6 && [6,7].includes(baccaratValue(playerThird))) {
            bankerThird = drawCard();
            banker.push(bankerThird);
            bankerDraws = true;
            bankerVal = baccaratScore(banker);
        }
    }

    // まず空に
    playerCardsElem.innerHTML = '';
    bankerCardsElem.innerHTML = '';
    playerScoreElem.textContent = '';
    bankerScoreElem.textContent = '';

    // 1枚ずつ順番にappend
    await appendCard(player[0], playerCardsElem, 400);
    await appendCard(banker[0], bankerCardsElem, 400);
    await appendCard(player[1], playerCardsElem, 400);
    await appendCard(banker[1], bankerCardsElem, 400);

    // 3枚目（必要な場合のみ）
    if (player.length === 3) {
        await appendCard(player[2], playerCardsElem, 400);
    }
    if (banker.length === 3) {
        await appendCard(banker[2], bankerCardsElem, 400);
    }

    playerScoreElem.textContent = `合計: ${baccaratScore(player)}`;
    bankerScoreElem.textContent = `合計: ${baccaratScore(banker)}`;

    let result = '';
    if (baccaratScore(player) > baccaratScore(banker)) result = 'player';
    else if (baccaratScore(player) < baccaratScore(banker)) result = 'banker';
    else result = 'tie';

    let payout = 0;
    let msg = [];

    // 配当計算
    for (const side of ['player', 'banker', 'tie']) {
        const bet = bets[side];
        if (bet > 0) {
            if (result === side) {
                if (side === 'tie') {
                    payout += bet * 9;
                    msg.push(`タイ${bet}円→${bet * 9}円獲得`);
                } else if (side === 'player') {
                    payout += bet * 2;
                    msg.push(`プレイヤー${bet}円→${bet * 2}円獲得`);
                } else if (side === 'banker') {
                    payout += Math.floor(bet * 1.95);
                    msg.push(`バンカー${bet}円→${Math.floor(bet * 1.95)}円獲得`);
                }
            }
        }
    }

    if (payout > 0) {
        balance += payout;
        msg.push(`合計${payout}円獲得！`);
    } else if (bets.player === 0 && bets.banker === 0 && bets.tie === 0) {
        msg.push('ベットなし');
    } else {
        msg.push('はずれ！');
    }

    await saveBalance(balance);
    updateBalanceDisplay();
    resultElem.textContent = msg.join(' / ');

    // 履歴追加
    if (result === 'player') {
        historyList.push('<span class="player">●</span>');
    } else if (result === 'banker') {
        historyList.push('<span class="banker">●</span>');
    } else if (result === 'tie') {
        historyList.push('<span class="tie">◎</span>');
    }
    if (historyList.length > 20) historyList.shift();
    historyElem.innerHTML = historyList.join('');

    setTimeout(async () => {
        resetCards();
        resultElem.textContent = '';
        balance = await fetchBalance();
        updateBalanceDisplay();
        startTimer();
    }, 2000);
}

// チップ選択
chipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        chipBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedChip = parseInt(btn.getAttribute('data-value'), 10);
    });
});

// ベットエリアクリック
[
    {area: playerBetArea, side: 'player', elem: playerBetElem},
    {area: bankerBetArea, side: 'banker', elem: bankerBetElem},
    {area: tieBetArea, side: 'tie', elem: tieBetElem}
].forEach(({area, side, elem}) => {
    area.addEventListener('click', async () => {
        if (betLocked) {
            resultElem.textContent = '次のラウンドまでお待ちください';
            return;
        }
        if (!selectedChip) {
            resultElem.textContent = 'チップを選択してください';
            return;
        }
        if (selectedChip > balance) {
            resultElem.textContent = '残高が足りません';
            return;
        }
        bets[side] += selectedChip;
        balance -= selectedChip;
        updateBalanceDisplay();
        elem.textContent = bets[side] + '円';
        area.classList.add('selected');
        resultElem.textContent = `${area.querySelector('span').textContent}：${bets[side]}円ベット中`;
        updateTotalBet();
        await saveBalance(balance);
        // バナー残高も即時更新
        if (document.querySelector('.balance')) {
            document.querySelector('.balance').innerHTML = `残高: <span id="baccarat-balance">${balance}</span>円`;
        }
    });
});

// 初期化
(async () => {
    resetCards();
    balance = await fetchBalance();
    updateBalanceDisplay();
    updateTotalBet();
    startTimer();
})();