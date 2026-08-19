const fixes = document.createElement('link');
fixes.rel = 'stylesheet';
fixes.href = 'assets/css/fixes.css';
document.head.append(fixes);

const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#ana-menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('is-open', !open);
  });
}

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('[data-category]').forEach((article) => {
      article.hidden = filter !== 'all' && article.dataset.category !== filter;
    });
  });
});

const copyButton = document.querySelector('[data-copy-link]');
if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(window.location.href);
      status.textContent = 'Kopyalandı.';
    } catch {
      status.textContent = 'Bağlantı: ' + window.location.href;
    }
  });
}
