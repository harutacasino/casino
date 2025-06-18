document.addEventListener('DOMContentLoaded', async () => {
    let currentCard = Math.floor(Math.random() * 13) + 1;
    let balance = 0;
    const email = localStorage.getItem('casino_email');

    async function fetchBalance() {
        const params = new URLSearchParams({
            email: email,
            action: 'getBalance'
        });
        const response = await fetch(`${GAS_URL}?${params.toString()}`);
        const data = await response.json();
        return data.balance || 0;
    }

    function setBalance(val) {
        balance = val;
        document.querySelector('.balance').textContent = `残高: ¥${balance}`;
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

    balance = await fetchBalance();
    setBalance(balance);

    document.getElementById('card-area').textContent = currentCard;
    document.getElementById('bet-amount').max = balance;

    document.getElementById('high-btn').addEventListener('click', () => play('high'));
    document.getElementById('low-btn').addEventListener('click', () => play('low'));

    function calculateOdds(current, choice) {
        const total = 12;
        const highCount = 13 - current;
        const lowCount = current - 1;

        if (choice === 'high') {
            return highCount > 0 ? (total / highCount) : 0;
        } else {
            return lowCount > 0 ? (total / lowCount) : 0;
        }
    }

    async function play(choice) {
        const bet = parseInt(document.getElementById('bet-amount').value, 10);
        if (isNaN(bet) || bet < 1 || bet > balance) {
            document.getElementById('result').textContent = '正しい掛け金を入力してください。';
            return;
        }

        const nextCard = Math.floor(Math.random() * 13) + 1;
        let resultText = `次のカード: ${nextCard} → `;
        let win = false;

        if (
            (choice === 'high' && nextCard > currentCard) ||
            (choice === 'low' && nextCard < currentCard)
        ) {
            win = true;
        }

 if (nextCard === currentCard) {
    resultText += '引き分け！（掛け金は戻りません）';
} else if (win) {
    const odds = calculateOdds(currentCard, choice);
    const payout = Math.floor(bet * odds);
    const profit = payout - bet;
    resultText += `勝ち！ オッズ: x${odds.toFixed(2)} → +¥${profit}`;
    balance += profit;
    setBalance(balance);
    await saveBalance(balance);
} else {
    resultText += `負け！ -¥${bet}`;
    balance -= bet;
    setBalance(balance);
    await saveBalance(balance);
}


        document.getElementById('result').textContent = resultText;
        currentCard = nextCard;
        document.getElementById('card-area').textContent = currentCard;
        document.getElementById('bet-amount').max = balance;
    }
});
