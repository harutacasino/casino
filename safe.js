// 金庫ボタン・モーダル制御・API連携

document.addEventListener('DOMContentLoaded', function() {
    // モーダル表示
    document.getElementById('safe-icon').onclick = function() {
        document.getElementById('safe-modal').classList.add('active');
        updateSafe();
    };
    // モーダル閉じる
    document.getElementById('close-safe-modal').onclick = function() {
        document.getElementById('safe-modal').classList.remove('active');
    };
    // モーダル外クリックで閉じる
    document.getElementById('safe-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });

    // タブ切り替え
    document.getElementById('tab-in').onclick = function() {
        document.getElementById('tab-in').classList.add('active');
        document.getElementById('tab-out').classList.remove('active');
        document.getElementById('safe-in-form').classList.add('active');
        document.getElementById('safe-out-form').classList.remove('active');
        document.getElementById('safe-result').textContent = '';
    };
    document.getElementById('tab-out').onclick = function() {
        document.getElementById('tab-in').classList.remove('active');
        document.getElementById('tab-out').classList.add('active');
        document.getElementById('safe-in-form').classList.remove('active');
        document.getElementById('safe-out-form').classList.add('active');
        document.getElementById('safe-result').textContent = '';
    };
});

// 金庫残高取得
async function updateSafe() {
    const email = localStorage.getItem('casino_email');
    if (!email) return;
    const params = new URLSearchParams({ email, action: 'getSafe' });
    const res = await fetch(`${GAS_URL}?${params.toString()}`);
    const data = await res.json();
    if (data.result === 'success') {
        document.getElementById('safe-balance').textContent = data.safe;
    }
}

// 預け入れ
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('safe-in-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const amount = document.getElementById('safe-in-amount').value;
        const password = document.getElementById('safe-in-password').value;
        const email = localStorage.getItem('casino_email');
        const params = new URLSearchParams({
            email, password, amount, direction: 'in', action: 'moveSafe'
        });
        const res = await fetch(`${GAS_URL}?${params.toString()}`);
        const data = await res.json();
        const resultDiv = document.getElementById('safe-result');
        if (data.result === 'success') {
            resultDiv.textContent = '預け入れ成功';
            updateSafe();
            if (typeof fetchBalance === 'function') fetchBalance();
        } else {
            resultDiv.textContent = data.message || 'エラー';
        }
    });

    // 引き出し
    document.getElementById('safe-out-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const amount = document.getElementById('safe-out-amount').value;
        const password = document.getElementById('safe-out-password').value;
        const email = localStorage.getItem('casino_email');
        const params = new URLSearchParams({
            email, password, amount, direction: 'out', action: 'moveSafe'
        });
        const res = await fetch(`${GAS_URL}?${params.toString()}`);
        const data = await res.json();
        const resultDiv = document.getElementById('safe-result');
        if (data.result === 'success') {
            resultDiv.textContent = '引き出し成功';
            updateSafe();
            if (typeof fetchBalance === 'function') fetchBalance();
        } else {
            resultDiv.textContent = data.message || 'エラー';
        }
    });
});