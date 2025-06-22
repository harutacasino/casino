let balance = 0;
let timer = 5;
let intervalId = null;
let betLocked = false;
let selectedChip = 0;
let bets = { dragon: 0, tiger: 0, tie: 0 };

const balanceElem = document.getElementById('dt-balance');
const dragonCardElem = document.getElementById('dragon-card');
const tigerCardElem = document.getElementById('tiger-card');
const resultElem = document.getElementById('dt-result');
const timerElem = document.getElementById('dt-timer');
const chipBtns = document.querySelectorAll('.dt-chip');
const dragonBetArea = document.getElementById('dragon-bet-area');
const tigerBetArea = document.getElementById('tiger-bet-area');
const tieBetArea = document.getElementById('tie-bet-area');
const dragonBetElem = document.getElementById('dragon-bet');
const tigerBetElem = document.getElementById('tiger-bet');
const tieBetElem = document.getElementById('tie-bet');
const historyElem = document.getElementById('dt-history');
let historyList = [];

// 合計ベット額表示
const totalBetElem = document.createElement('div');
totalBetElem.className = 'dt-totalbet';
document.querySelector('.dt-container').insertBefore(totalBetElem, document.querySelector('.dt-chips'));

function updateTotalBet() {
    const total = bets.dragon + bets.tiger + bets.tie;
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
        document.querySelector('.balance').innerHTML = `残高: <span id="dt-balance">${balance}</span>円`;
    }
}

function resetCards() {
    dragonCardElem.textContent = '?';
    tigerCardElem.textContent = '?';
}

function resetBets() {
    bets = { dragon: 0, tiger: 0, tie: 0 };
    dragonBetElem.textContent = '';
    tigerBetElem.textContent = '';
    tieBetElem.textContent = '';
    [dragonBetArea, tigerBetArea, tieBetArea].forEach(area => area.classList.remove('selected'));
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

async function playRound() {
    betLocked = true;
    // カードを配る
    const dragon = Math.floor(Math.random() * 13) + 1;
    const tiger = Math.floor(Math.random() * 13) + 1;
    dragonCardElem.textContent = cardText(dragon);
    tigerCardElem.textContent = cardText(tiger);

    let result = '';
    if (dragon > tiger) result = 'dragon';
    else if (dragon < tiger) result = 'tiger';
    else result = 'tie';

    let payout = 0;
    let msg = [];

    // 配当計算（表示はベット額＋配当分で表現）
    for (const side of ['dragon', 'tiger', 'tie']) {
    const bet = bets[side];
    if (bet > 0) {
        if (result === side) {
            if (side === 'tie') {
                payout += bet * 11; // タイは11倍
                msg.push(`タイ${bet}円→${bet * 11}円獲得`);
            } else {
                payout += bet * 2; // ドラゴン・タイガーは2倍
                msg.push(`${side === 'dragon' ? 'ドラゴン' : 'タイガー'}${bet}円→${bet * 2}円獲得`);
            }
        } else if ((side === 'dragon' || side === 'tiger') && result === 'tie') {
            payout += Math.floor(bet / 2);
            msg.push(`${side === 'dragon' ? 'ドラゴン' : 'タイガー'}タイで半額返金${Math.floor(bet / 2)}円`);
        }
    }
}

    if (payout > 0) {
  balance += payout;
  msg.push(`合計${payout}円獲得！`);
} else if (bets.dragon === 0 && bets.tiger === 0 && bets.tie === 0) {
  msg.push('ベットなし');
} else {
  msg.push('はずれ！');
}

// ★ここで残高チェックして自動チャージ
if (balance <= 0) {
  balance = 1000;
  msg.push('残高が0なので自動チャージ！+1000円');
}

await saveBalance(balance);
updateBalanceDisplay();
resultElem.textContent = msg.join(' / ');


    // 履歴追加
    if (result === 'dragon') {
        historyList.push('<span class="dragon">●</span>');
    } else if (result === 'tiger') {
        historyList.push('<span class="tiger">●</span>');
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
    }, 1500);
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
    {area: dragonBetArea, side: 'dragon', elem: dragonBetElem},
    {area: tigerBetArea, side: 'tiger', elem: tigerBetElem},
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
        await saveBalance(balance); // ベットごとにGASへ即時反映
        // バナー残高も即時更新
        if (document.querySelector('.balance')) {
            document.querySelector('.balance').innerHTML = `残高: <span id="dt-balance">${balance}</span>円`;
        }
    });
});

function cardText(num) {
    if (num === 1) return 'A';
    if (num === 11) return 'J';
    if (num === 12) return 'Q';
    if (num === 13) return 'K';
    return num;
}

// 初期化
(async () => {
    resetCards();
    balance = await fetchBalance();
    updateBalanceDisplay();
    updateTotalBet();
    startTimer();
})();
