/* ============================================================
   NEXORA LABS — main.js
   Shared UI behaviour: nav state, mobile menu, scroll reveals,
   hero console typing effect, cart badge sync.
   ============================================================ */

(function(){
  // ---- Nav scroll state ----
  const nav = document.querySelector('.nav');
  if(nav){
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
  }

  // ---- Mobile menu ----
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open-mobile');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---- Hero console typing effect ----
  const typeTarget = document.querySelector('[data-type-lines]');
  if(typeTarget){
    let lines;
    try{ lines = JSON.parse(typeTarget.getAttribute('data-type-lines')); }
    catch(e){ lines = []; }
    let li = 0, ci = 0, deleting = false;
    const speedType = 32, speedDelete = 16, hold = 1400;

    function tick(){
      const current = lines[li];
      if(!deleting){
        ci++;
        typeTarget.textContent = current.slice(0, ci);
        if(ci === current.length){
          deleting = true;
          setTimeout(tick, hold);
          return;
        }
        setTimeout(tick, speedType);
      } else {
        ci--;
        typeTarget.textContent = current.slice(0, ci);
        if(ci === 0){
          deleting = false;
          li = (li + 1) % lines.length;
        }
        setTimeout(tick, speedDelete);
      }
    }
    if(lines.length) tick();
  }

  // ---- Cart badge (shared across pages via NexoraCart) ----
  function syncCartBadge(){
    const badge = document.querySelector('[data-cart-count]');
    if(!badge || !window.NexoraCart) return;
    const count = window.NexoraCart.getItemCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  document.addEventListener('nexora:cart-updated', syncCartBadge);
  document.addEventListener('DOMContentLoaded', syncCartBadge);
  syncCartBadge();

  // ---- Active nav link ----
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-nav]').forEach(a => {
    if(a.getAttribute('data-nav') === path) a.classList.add('active');
  });
})();
