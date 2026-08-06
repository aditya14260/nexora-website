/* ============================================================
   NEXORA LABS — checkout.js
   Renders the cart summary, computes the 50% advance (like a
   shopping-app deposit), and kicks off a Razorpay payment for
   the advance amount only. Requires firebase-config.js and
   cart.js to run first.

   IMPORTANT — Razorpay needs a backend:
   Razorpay (and every real gateway) requires an *order* to be
   created server-side with your secret key before checkout can
   open — a secret key must never live in front-end code. The
   call to fetch('/api/create-order', ...) below assumes you'll
   add a small backend route for that (a ready-to-use Node example
   is in README.md). Until that route exists, the button will show
   a clear "connect a backend" message instead of failing silently.
   ============================================================ */

(function(){
  const cart = window.NexoraCart;
  const RAZORPAY_KEY_ID = 'rzp_test_TMBGBtVNRxHSAO'; // public key only — safe on the client

  const els = {
    empty: document.getElementById('checkout-empty'),
    filled: document.getElementById('checkout-filled'),
    lines: document.getElementById('order-lines'),
    siteTotal: document.getElementById('sum-site'),
    featTotal: document.getElementById('sum-features'),
    subtotal: document.getElementById('sum-subtotal'),
    advance: document.getElementById('sum-advance'),
    balance: document.getElementById('sum-balance'),
    advanceBig: document.getElementById('advance-big'),
    payBtn: document.getElementById('pay-btn'),
    payMsg: document.getElementById('pay-msg'),
    nameField: document.getElementById('order-name'),
    emailField: document.getElementById('order-email'),
    phoneField: document.getElementById('order-phone'),
    notesField: document.getElementById('order-notes'),
  };

  function render(){
    const site = cart.getSiteType();
    const feats = cart.getFeatures();
    const totals = cart.getTotals();
    const hasItems = !!site || feats.length;

    if(els.empty) els.empty.style.display = hasItems ? 'none' : 'block';
    if(els.filled) els.filled.style.display = hasItems ? 'block' : 'none';
    if(!hasItems) return;

    els.lines.innerHTML = '';
    if(site){
      els.lines.appendChild(orderLine(site.name, 'Site type', site.price));
    }
    feats.forEach(f => els.lines.appendChild(orderLine(f.name, 'Add-on', f.price)));

    els.siteTotal.textContent = cart.formatINR(totals.siteTotal);
    els.featTotal.textContent = cart.formatINR(totals.featuresTotal);
    els.subtotal.textContent = cart.formatINR(totals.subtotal);
    els.advance.textContent = cart.formatINR(totals.advance);
    els.balance.textContent = cart.formatINR(totals.balance);
    els.advanceBig.textContent = cart.formatINR(totals.advance);
  }

  function orderLine(title, kind, price){
    const row = document.createElement('div');
    row.className = 'order-line';
    row.innerHTML = `
      <div>
        <div class="order-line-title">${title}</div>
        <div class="order-line-kind">${kind}</div>
      </div>
      <div class="order-line-price">${cart.formatINR(price)}</div>
    `;
    return row;
  }

  function setPayMsg(text, type){
    if(!els.payMsg) return;
    els.payMsg.textContent = text;
    els.payMsg.className = 'form-msg show ' + (type || 'error');
  }

  async function saveOrder(status, extra){
    const totals = cart.getTotals();
    const site = cart.getSiteType();
    const feats = cart.getFeatures();
    const user = (typeof auth !== 'undefined') ? auth.currentUser : null;

    const order = {
      uid: user ? user.uid : null,
      customer: {
        name: els.nameField.value.trim(),
        email: els.emailField.value.trim(),
        phone: els.phoneField.value.trim(),
        notes: els.notesField.value.trim(),
      },
      siteType: site ? { id:site.id, name:site.name, price:site.price } : null,
      features: feats.map(f => ({ id:f.id, name:f.name, price:f.price })),
      totals,
      status, // 'advance_paid' | 'pending'
      createdAt: (typeof firebase !== 'undefined') ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      ...extra
    };

    try{
      if(typeof db !== 'undefined'){
        await db.collection('orders').add(order);
      }
    }catch(e){
      console.warn('Could not save order to Firestore:', e.message);
    }
    return order;
  }

  function validateContact(){
    if(!els.nameField.value.trim() || !els.emailField.value.trim() || !els.phoneField.value.trim()){
      setPayMsg('Please fill in your name, email and phone before paying.', 'error');
      return false;
    }
    return true;
  }

  async function startPayment(){
    if(!validateContact()) return;
    const totals = cart.getTotals();
    if(totals.subtotal <= 0){
      setPayMsg('Your cart is empty — add a site type first.', 'error');
      return;
    }

    els.payBtn.disabled = true;
    els.payBtn.textContent = 'Preparing payment…';
    setPayMsg('', '');
    els.payMsg.className = 'form-msg';

    try{
      // Server-side order creation (amount is in paise for Razorpay).
      const res = await fetch('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totals.advance * 100, currency: 'INR' })
      });
      if(!res.ok) throw new Error('backend-missing');
      const order = await res.json();

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Nexora Labs',
        description: '50% advance payment for your website order',
        order_id: order.id,
        prefill: {
          name: els.nameField.value.trim(),
          email: els.emailField.value.trim(),
          contact: els.phoneField.value.trim(),
        },
        theme: { color: '#ff4fa3' },
        handler: async function(response){
          await saveOrder('advance_paid', { razorpay: response });
          window.location.href = 'checkout.html?success=1';
        },
        modal: {
          ondismiss: function(){
            els.payBtn.disabled = false;
            els.payBtn.textContent = `Pay 50% advance — ${cart.formatINR(totals.advance)}`;
          }
        }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    }catch(err){
      // No backend connected yet — this is expected until one is added.
      setPayMsg(
        'Payment gateway needs a backend endpoint (/api/create-order) to create a Razorpay order securely — see README.md for a ready-to-use example. For now your order details have been saved as "pending".',
        'error'
      );
      await saveOrder('pending', {});
      els.payBtn.disabled = false;
      els.payBtn.textContent = `Pay 50% advance — ${cart.formatINR(totals.advance)}`;
    }
  }

  if(els.payBtn){
    els.payBtn.addEventListener('click', startPayment);
  }

  document.addEventListener('nexora:cart-updated', render);
  document.addEventListener('DOMContentLoaded', render);
  render();

  // success banner
  if(new URLSearchParams(location.search).get('success') === '1'){
    document.addEventListener('DOMContentLoaded', () => {
      const banner = document.getElementById('success-banner');
      if(banner) banner.classList.add('show');
      cart.clear();
    });
  }
})();
