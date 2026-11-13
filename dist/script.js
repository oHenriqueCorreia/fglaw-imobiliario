const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');
let lastScroll = window.scrollY;

const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'];
const campaignAttribution = {};

try {
  const storedCampaign = JSON.parse(sessionStorage.getItem('fglaw_campaign') || '{}');
  const currentParams = new URLSearchParams(window.location.search);
  campaignKeys.forEach((key) => {
    const value = currentParams.get(key) || storedCampaign[key];
    if (value) campaignAttribution[key] = value;
  });
  if (campaignKeys.some((key) => currentParams.get(key))) {
    sessionStorage.setItem('fglaw_campaign', JSON.stringify(campaignAttribution));
  }
} catch {
  // O rastreamento continua funcionando mesmo quando o armazenamento está bloqueado.
}

const trackEvent = (eventName, parameters = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...campaignAttribution,
    ...parameters
  });
};

if (Object.keys(campaignAttribution).length) {
  trackEvent('campaign_attribution');
}

const closeMenu = () => {
  menu?.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menu');
  document.body.classList.remove('menu-open');
};

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
  menu?.classList.toggle('is-open', !open);
  document.body.classList.toggle('menu-open', !open);
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
  link.addEventListener('click', () => {
    const clickLocation = link.classList.contains('whatsapp-float')
      ? 'floating_button'
      : link.closest('header')
        ? 'header'
        : link.closest('footer')
          ? 'footer'
          : link.closest('section')?.id || 'page';
    trackEvent('cta_click', {
      cta_text: link.textContent.trim().replace(/\s+/g, ' '),
      cta_location: clickLocation
    });
    trackEvent('whatsapp_click', {
      click_location: clickLocation
    });
  });
});

document.querySelectorAll('a[href*="instagram.com"]').forEach((link) => {
  link.addEventListener('click', () => trackEvent('social_click', { social_network: 'instagram', click_location: 'footer' }));
});

document.querySelectorAll('a[href*="google.com/maps"]').forEach((link) => {
  link.addEventListener('click', () => trackEvent('location_click', { click_location: 'footer' }));
});

window.addEventListener('scroll', () => {
  const current = window.scrollY;
  header?.classList.toggle('is-scrolled', current > 30);
  header?.classList.toggle('is-hidden', current > lastScroll && current > 260 && !menu?.classList.contains('is-open'));
  lastScroll = current;
}, { passive: true });

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

document.querySelectorAll('.faq-item').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-item[open]').forEach((other) => {
      if (other !== item) other.removeAttribute('open');
    });
  });
});

const modal = document.querySelector('[data-privacy-modal]');
document.querySelector('[data-privacy-open]')?.addEventListener('click', () => modal?.showModal());
document.querySelector('[data-privacy-close]')?.addEventListener('click', () => modal?.close());
modal?.addEventListener('click', (event) => {
  const bounds = modal.getBoundingClientRect();
  const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
  if (!inside) modal.close();
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
