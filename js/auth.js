/* ============================================================
   NEXORA LABS — auth.js
   Handles the login/signup form on login.html using Firebase Auth.
   Requires firebase-config.js to run first.
   ============================================================ */

(function(){
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');
  const msg = document.getElementById('auth-msg');

  function showTab(which){
    const isLogin = which === 'login';
    tabLogin.classList.toggle('active-tab', isLogin);
    tabSignup.classList.toggle('active-tab', !isLogin);
    formLogin.style.display = isLogin ? 'block' : 'none';
    formSignup.style.display = isLogin ? 'none' : 'block';
    hideMsg();
  }
  if(tabLogin && tabSignup){
    tabLogin.addEventListener('click', () => showTab('login'));
    tabSignup.addEventListener('click', () => showTab('signup'));
  }

  function showMsg(text, type){
    msg.textContent = text;
    msg.className = 'form-msg show ' + type;
  }
  function hideMsg(){
    msg.className = 'form-msg';
  }

  function friendlyError(err){
    const map = {
      'auth/invalid-email': 'That email address looks invalid.',
      'auth/user-not-found': 'No account found with that email.',
      'auth/wrong-password': 'Incorrect password. Try again.',
      'auth/email-already-in-use': 'An account already exists with that email.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    };
    return map[err.code] || err.message || 'Something went wrong. Please try again.';
  }

  function redirectAfterAuth(){
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || 'builder.html';
    location.href = next;
  }

  // ---- Email/password login ----
  if(formLogin){
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMsg();
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-password').value;
      const btn = formLogin.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Signing in…';
      try{
        await auth.signInWithEmailAndPassword(email, pass);
        showMsg('Welcome back — redirecting…', 'success');
        setTimeout(redirectAfterAuth, 600);
      }catch(err){
        showMsg(friendlyError(err), 'error');
      }finally{
        btn.disabled = false; btn.textContent = 'Log in';
      }
    });
  }

  // ---- Email/password signup ----
  if(formSignup){
    formSignup.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMsg();
      const name  = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const pass  = document.getElementById('signup-password').value;
      const btn = formSignup.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Creating account…';
      try{
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await cred.user.updateProfile({ displayName: name });
        await db.collection('users').doc(cred.user.uid).set({
          name, email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge:true });
        showMsg('Account created — redirecting…', 'success');
        setTimeout(redirectAfterAuth, 600);
      }catch(err){
        showMsg(friendlyError(err), 'error');
      }finally{
        btn.disabled = false; btn.textContent = 'Create account';
      }
    });
  }

  // ---- Google sign-in ----
  document.querySelectorAll('[data-google-signin]').forEach(btn => {
    btn.addEventListener('click', async () => {
      hideMsg();
      const provider = new firebase.auth.GoogleAuthProvider();
      try{
        const cred = await auth.signInWithPopup(provider);
        await db.collection('users').doc(cred.user.uid).set({
          name: cred.user.displayName || '',
          email: cred.user.email || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge:true });
        showMsg('Signed in with Google — redirecting…', 'success');
        setTimeout(redirectAfterAuth, 600);
      }catch(err){
        showMsg(friendlyError(err), 'error');
      }
    });
  });

  // ---- Logout (used in nav where present) ----
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await auth.signOut();
      location.href = 'login.html';
    });
  });

  // ---- Reflect auth state in nav (email or "Login") ----
  auth.onAuthStateChanged((user) => {
    document.querySelectorAll('[data-auth-slot]').forEach(slot => {
      if(user){
        const first = (user.displayName || user.email || 'Account').split(' ')[0];
        slot.innerHTML = `<span class="tag blue" title="${user.email || ''}">● ${first}</span> <button data-logout class="btn btn-outline btn-sm" style="margin-left:8px;">Log out</button>`;
        slot.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', async () => { await auth.signOut(); location.href = 'login.html'; }));
      } else {
        slot.innerHTML = `<a href="login.html" class="btn btn-outline btn-sm">Log in</a>`;
      }
    });
  });
})();
