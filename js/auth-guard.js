/* ============================================================
   NEXORA LABS — auth-guard.js
   Protects a page: if nobody is signed in, redirect straight to
   login.html before the page becomes usable. Must be loaded
   AFTER firebase-config.js (needs the `auth` object), and the
   page must include a <div id="auth-veil">...</div> as the very
   first thing inside <body> so there's no flash of protected
   content before the check completes.
   ============================================================ */

(function(){
  auth.onAuthStateChanged((user) => {
    const veil = document.getElementById('auth-veil');
    if(!user){
      const current = location.pathname.split('/').pop() || 'builder.html';
      location.replace('login.html?next=' + encodeURIComponent(current));
      return;
    }
    if(veil) veil.remove();
  });
})();
