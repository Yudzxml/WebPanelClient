const API_CREATE = 'https://api-payment-yudzxml.vercel.app/api/createTransaction';
  const API_STATUS = 'https://api-payment-yudzxml.vercel.app/api/getTransaction';
  const API_CANCEL = 'https://api-payment-yudzxml.vercel.app/api/cancelTransaction';

  let currentTransactionId = null;
  let pollingInterval = null;

  function showAlert(msg, type = 'success') {
    const box = document.getElementById('customAlert');
    box.className = '';
    box.classList.add('show', type);
    document.getElementById('customAlertText').innerText = msg;
    clearTimeout(box.timer);
    box.timer = setTimeout(hideAlert, 4000);
  }

  function hideAlert() {
    const box = document.getElementById('customAlert');
    box.classList.remove('show', 'success', 'error', 'info');
  }

  async function createTransaction(external_id, amount, name, email, phone) {
    const payload = {
      external_id,
      amount,
      description: 'Perpanjangan akun',
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      webhook_url: ''
    };
    const res = await fetch(API_CREATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async function getTransaction(id) {
    const res = await fetch(`${API_STATUS}?id=${id}`);
    return res.json();
  }

  async function cancelTransaction(id) {
  try {
    const response = await fetch(`https://api-payment-yudzxml.vercel.app/api/cancelTransaction?id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Gagal membatalkan transaksi.' };
    }

    return data
  } catch (err) {
    console.error('❌ Gagal membatalkan transaksi:', err);
    return { success: false, message: err.message || 'Terjadi kesalahan saat membatalkan.' };
  }
}

  document.getElementById('payBtn').addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const [days, price] = document.getElementById('paket').value.split('|').map(Number);
    if (!name) return showAlert('Nama wajib diisi!', 'error');
    if (!email) return showAlert('Email wajib diisi!', 'error');
    if (!phone) return showAlert('Nomor telepon wajib diisi!', 'error');

    const btn = document.getElementById('payBtn');
    btn.disabled = true;
    btn.innerText = 'Membuat transaksi...';

    const externalId = `ORDER${Math.floor(100000 + Math.random() * 900000)}`;
    let trx;
    try {
      trx = await createTransaction(externalId, price, name, email, phone);
      if (!trx.success) throw new Error(trx.message || 'Gagal membuat transaksi');
    } catch (e) {
      showAlert(e.message, 'error');
      btn.disabled = false;
      btn.innerText = 'Bayar & Perpanjang';
      return;
    }

    // Simpan ID transaksi & tampilkan QR
    currentTransactionId = trx.data.transaction_id;
    const kodeUnik = trx.data.unique_code;
    const biayaAdmin = trx.data.fee;
    const biayaPpn = 
    document.getElementById('qrisImg').src = `/api/qrGenerate?text=${encodeURIComponent(trx.data.qris_url)}`;
    
    document.getElementById('expireInfo').innerText =
   `Ppn: Rp ${ (trx.data.unique_code + trx.data.fee).toLocaleString('id-ID') }\n`;
  `Total: Rp ${trx.data.total_amount.toLocaleString('id-ID')}\n` +
  'Expired: ' + new Date(trx.data.expired_at).toLocaleString('id-ID');
    document.getElementById('qrisContainer').style.display = 'block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    btn.innerText = 'Menunggu pembayaran...';

    // Mulai polling
    pollingInterval = setInterval(async () => {
      const statusRes = await getTransaction(currentTransactionId);
      if (statusRes.success && /paid/i.test(statusRes.data.status)) {
        clearInterval(pollingInterval);
        showAlert('Pembayaran terkonfirmasi! Memperpanjang...', 'info');

        try {
          const updRes = await fetch("/api/update-user", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, changeDays: days })
          });
          const updData = await updRes.json();
          if (!updRes.ok) throw new Error(updData.message || 'Gagal memperpanjang');
          showAlert(`Sukses diperpanjang +${days} hari!`, 'success');
        } catch (e) {
          showAlert(e.message, 'error');
        } finally {
          btn.disabled = false;
          btn.innerText = 'Bayar & Perpanjang';
          document.getElementById('cancelBtn').style.display = 'none';
        }
      }
    }, 2000);
  });

  document.getElementById('cancelBtn').addEventListener('click', async () => {
  if (!currentTransactionId) return;

  const cancelBtn = document.getElementById('cancelBtn');
  const payBtn = document.getElementById('payBtn');

  cancelBtn.disabled = true;
  showAlert('Membatalkan transaksi...', 'info');

  try {
    const cancelRes = await cancelTransaction(currentTransactionId);
    if (!cancelRes.success) throw new Error(cancelRes.message || 'Gagal membatalkan');

    showAlert('✅ Transaksi berhasil dibatalkan.', 'success');
  } catch (e) {
    showAlert(`❌ ${e.message}`, 'error');
  } finally {
    clearInterval(pollingInterval);
    currentTransactionId = null;
    pollingInterval = null;

    cancelBtn.style.display = 'none';
    document.getElementById('qrisContainer').style.display = 'none';

    payBtn.disabled = false;
    payBtn.innerText = 'Bayar & Perpanjang';

    // Kosongkan input form
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
  }
});
