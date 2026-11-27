const menu = document.querySelector('.studio-mobile-nav');
if (menu) {
  const trigger = menu.querySelector('summary');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      trigger.focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu.open && (!menu.contains(event.target) || event.target.closest('a'))) menu.open = false;
  });
  matchMedia('(min-width: 1001px)').addEventListener('change', event => {
    if (event.matches) menu.open = false;
  });
}
