(function () {
  'use strict';
  const backend = window.FUTMAC_SUPABASE;
  const form = document.querySelector('[data-password-reset-form]');
  const message = document.querySelector('[data-password-reset-message]');
  if (!backend || !backend.enabled) {
    message.textContent = 'Parola yenileme yalnızca Supabase bağlantısı açıkken kullanılabilir.';
    form.querySelector('button').disabled = true;
    return;
  }
  message.textContent = 'Yeni parolanızı belirleyebilirsiniz.';
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const password = form.elements.password.value;
    const confirmation = form.elements.passwordConfirm.value;
    if (password !== confirmation) {
      message.textContent = 'Parolalar birbiriyle eşleşmiyor.';
      form.elements.passwordConfirm.focus();
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    message.textContent = 'Parola güncelleniyor…';
    try {
      await backend.updatePassword(password);
      form.reset();
      message.innerHTML = 'Parolanız güncellendi. <a href="admin.html">Yönetici paneline giriş yapın.</a>';
    } catch (error) {
      const detail = String(error && error.message || '');
      message.textContent = detail.toLowerCase().includes('password')
        ? 'Parola güvenlik koşullarını karşılamıyor. Daha güçlü bir parola deneyin.'
        : 'Bağlantı geçersiz veya süresi dolmuş. Yönetici girişinden yeni bağlantı isteyin.';
    } finally {
      submit.disabled = false;
    }
  });
}());
