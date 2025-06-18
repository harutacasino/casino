document.addEventListener('DOMContentLoaded', async () => {
    let currentCard = Math.floor(Math.random() * 13) + 1;
    let balance = 0;

    // GASのWebアプリURL
   const email = localStorage.getItem('casino_email');

    // GASから残高を取得
    async function fetchBalance() {
        const params = new URLSearchParams({
            email: email,
            action: 'getBalance'
        });
        const response = await fetch(`${GAS_URL}?${params.toString()}`);
        const data = await response.json();
        return data.balance || 0;
    }

    // 残高を表示
    function setBalance(val) {
        balance = val;
        document.querySelector('.balance').textContent = `残高: ¥${balance}`;
    }

    // 残高をGASに保存
    async function saveBalance(newBalance) {
        if (!email) return;
        const params = new URLSearchParams({
            email: email,
            balance: newBalance,
            action: 'updateBalance'
        });
        await fetch(`${GAS_URL}?${params.toString()}`);
    }

    // ここでGASから残高を取得してからUIを初期化
    balance = await fetchBalance();
    setBalance(balance);

    // 初期カード表示
    document.getElementById('card-area').textContent = currentCard;

    // 掛け金の最大値をセット
    document.getElementById('bet-amount').max = balance;

    // ボタンイベント
    document.getElementById('high-btn').addEventListener('click', () => play('high'));
    document.getElementById('low-btn').addEventListener('click', () => play('low'));

    async function play(choice) {
        const bet = parseInt(document.getElementById('bet-amount').value, 10);
        if (isNaN(bet) || bet < 1 || bet > balance) {
            document.getElementById('result').textContent = '正しい掛け金を入力してください。';
            return;
        }

        const nextCard = Math.floor(Math.random() * 13) + 1;
        let resultText = `次のカード: ${nextCard} → `;

        if (
            (choice === 'high' && nextCard > currentCard) ||
            (choice === 'low' && nextCard < currentCard)
        ) {
            resultText += `あなたの勝ち！ +¥${bet}`;
            setBalance(balance + bet);
            await saveBalance(balance);
        } else if (nextCard === currentCard) {
            resultText += '引き分け！';
        } else {
            resultText += `あなたの負け！ -¥${bet}`;
            setBalance(balance - bet);
            await saveBalance(balance);
        }

        document.getElementById('result').textContent = resultText;
        currentCard = nextCard;
        document.getElementById('card-area').textContent = currentCard;
        document.getElementById('bet-amount').max = balance;
    }
});