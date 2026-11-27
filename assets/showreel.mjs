import { track } from './analytics.mjs';

const directory = '/assets/evidence/showreel/';
for (const button of document.querySelectorAll('[data-showreel-play]')) {
  button.addEventListener('click', () => {
    const english = document.documentElement.lang === 'en';
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = directory + 'poster.webp';
    video.setAttribute('aria-label', english ? 'Quantquer technical showreel' : '量維資科工程成果短片');
    for (const format of ['webm', 'mp4']) {
      const source = document.createElement('source');
      source.src = directory + 'quantquer-technical-showreel.' + format;
      source.type = 'video/' + format;
      video.append(source);
    }
    for (const [locale, name] of [['zh', '繁體中文'], ['en', 'English']]) {
      const caption = document.createElement('track');
      caption.kind = 'captions';
      caption.srclang = locale === 'zh' ? 'zh-Hant' : 'en';
      caption.label = name;
      caption.src = directory + 'captions-' + locale + '.vtt';
      caption.default = locale === (english ? 'en' : 'zh');
      video.append(caption);
    }
    video.addEventListener('playing', () => track('showreel_started'), { once: true });
    video.addEventListener('ended', () => track('showreel_completed'));
    const frame = button.parentElement;
    button.replaceWith(video);
    video.focus();
    video.play().catch(() => {
      if (video.error) frame.classList.add('showreel-unavailable');
    });
  }, { once: true });
}
