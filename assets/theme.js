(() => {
  const root = document.documentElement;
  let mode = 'light';

  try {
    if (localStorage.getItem('theme') === 'dark') mode = 'dark';
  } catch {
    // The theme still works when storage is unavailable.
  }

  root.dataset.theme = mode;

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('themeToggle');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const images = Array.from(document.querySelectorAll('.cfig img, .method-fig img'), img => ({
      img,
      src: img.getAttribute('src'),
      srcset: img.getAttribute('srcset'),
    }));
    const darkVariant = value => value.replace(/\.webp(?=[\s,]|$)/g, '-dark.webp');

    function updateTheme() {
      const dark = mode === 'dark';
      button.textContent = dark ? '☀︎' : '☾︎';
      button.setAttribute('aria-label', dark ? '切換亮色模式' : '切換深色模式');
      themeColor?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
      for (const {img, src, srcset} of images) {
        if (srcset) img.setAttribute('srcset', dark ? darkVariant(srcset) : srcset);
        img.setAttribute('src', dark ? darkVariant(src) : src);
      }
      document.dispatchEvent(new Event('quantquer:themechange'));
    }

    updateTheme();
    button.addEventListener('click', () => {
      mode = mode === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', mode);
      } catch {
        // Keep the selected theme for this page.
      }
      root.dataset.theme = mode;
      updateTheme();
    });
  });
})();
