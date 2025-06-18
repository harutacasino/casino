async function fetchBalance() {
    const email = localStorage.getItem('casino_email');
    if (!email) {
        alert('ログイン情報がありません。再度ログインしてください。');
        window.location.href = 'login.html';
        return;
    }
    try {
        const params = new URLSearchParams({
            email: email,
            action: 'getBalance'
        });
        const response = await fetch(`${GAS_URL}?${params.toString()}`);
        const data = await response.json();

        if (data.result === 'success') {
            document.querySelector('.balance').textContent = `残高: ¥${data.balance}`;
            document.querySelector('.user-info').textContent = `ようこそ, ${data.username}`;
        } else {
            document.querySelector('.balance').textContent = '残高取得失敗';
        }
    } catch (e) {
        document.querySelector('.balance').textContent = '通信エラー';
    }
}

// 送金フォーム送信処理
document.getElementById('transfer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const to = document.getElementById('transfer-to').value.trim();
    const amount = document.getElementById('transfer-amount').value;
    const password = document.getElementById('transfer-password').value;
    const email = localStorage.getItem('casino_email');
    const resultDiv = document.getElementById('transfer-result');
    if (!to || !amount || !password) {
        resultDiv.textContent = '全て入力してください';
        return;
    }
    try {
        const params = new URLSearchParams({
            action: 'transfer',
            email,
            to,
            amount,
            password
        });
        const res = await fetch(`${GAS_URL}?${params.toString()}`);
        const data = await res.json();
        if (data.result === 'success') {
            resultDiv.textContent = '送金成功！';
        } else {
            resultDiv.textContent = data.message || '送金失敗';
        }
    } catch {
        resultDiv.textContent = '通信エラー';
    }
});

function updateRanking() {
    const tableBody = document.querySelector('#ranking-table tbody');
    fetch(`${GAS_URL}?action=getRanking`)
        .then(res => res.json())
        .then(data => {
            if (data.result === 'success' && Array.isArray(data.ranking)) {
                tableBody.innerHTML = '';
                data.ranking
                    .sort((a, b) => b.balance - a.balance)
                    .forEach((user, idx) => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${idx + 1}</td>
                            <td>${user.username}</td>
                            <td>¥${user.balance}</td>
                        `;
                        tableBody.appendChild(tr);
                    });
            } else {
                tableBody.innerHTML = '<tr><td colspan="3">ランキング取得失敗</td></tr>';
            }
        })
        .catch(() => {
            tableBody.innerHTML = '<tr><td colspan="3">通信エラー</td></tr>';
        });
}

async function showAdminMenuIfNeeded() {
    const email = localStorage.getItem('casino_email');
    if (!email) return;
    const params = new URLSearchParams({
        email: email,
        action: 'getBalance'
    });
    try {
        const res = await fetch(`${GAS_URL}?${params.toString()}`);
        const data = await res.json();
        if (data.isAdmin) {
            document.getElementById('admin-menu').style.display = '';
        } else {
            document.getElementById('admin-menu').style.display = 'none';
        }
    } catch {
        document.getElementById('admin-menu').style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    fetchBalance();
    updateRanking();
    showAdminMenuIfNeeded();
    setInterval(() => {
        fetchBalance();
        updateRanking();
    }, 500); // 0.5秒ごとに残高とランキングを自動更新
});

    // ランキング取得・表示
    window.addEventListener('DOMContentLoaded', async () => {
        const tableBody = document.querySelector('#ranking-table tbody');
        try {
            const res = await fetch(`${GAS_URL}?action=getRanking`);
            const data = await res.json();
            if (data.result === 'success' && Array.isArray(data.ranking)) {
                tableBody.innerHTML = '';
                data.ranking
                    .sort((a, b) => b.balance - a.balance)
                    .forEach((user, idx) => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${idx + 1}</td>
                            <td>${user.username}</td>
                            <td>¥${user.balance}</td>
                        `;
                        tableBody.appendChild(tr);
                    });
            } else {
                tableBody.innerHTML = '<tr><td colspan="3">ランキング取得失敗</td></tr>';
            }
        } catch (e) {
            tableBody.innerHTML = '<tr><td colspan="3">通信エラー</td></tr>';
        }
    });