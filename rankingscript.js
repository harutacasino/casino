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