/* ============================================================
   NEXORA LABS — cart.js
   Catalog of site types + add-on features, and a small cart
   store persisted to localStorage. Shared by builder.html
   (adding items) and checkout.html (reading + paying).

   Prices are in INR (₹), stored as integers (paise-free, whole rupees).
   ============================================================ */

(function(window){

  const STORAGE_KEY = 'nexora_cart_v1';
  const ADVANCE_RATIO = 0.5; // client pays 50% up front, like a shopping-app deposit

  // ---------------- Catalog ----------------
  const SITE_TYPES = [
    { id:'business',   name:'Business / Portfolio',   price:8999,  blurb:'A sharp, credible presence for a company, freelancer or studio.', tag:'red' },
    { id:'ecommerce',  name:'E-Commerce Store',        price:19999, blurb:'Product catalog, cart and checkout for selling online.', tag:'pink' },
    { id:'restaurant', name:'Restaurant / Café',       price:12999, blurb:'Menu, gallery and table/order enquiries with a warm feel.', tag:'red' },
    { id:'realestate', name:'Real Estate',             price:15999, blurb:'Listings, filters and enquiry capture for properties.', tag:'blue' },
    { id:'education',  name:'Online Course / Academy', price:17999, blurb:'Course pages, curriculum and student enquiry flow.', tag:'blue' },
    { id:'saas',       name:'SaaS / Startup Landing',  price:14999, blurb:'Product story, pricing tiers and conversion-first layout.', tag:'pink' },
    { id:'blog',       name:'Personal Blog',           price:6999,  blurb:'A fast, clean writing space with categories and search.', tag:'red' },
    { id:'event',      name:'Event / Wedding',         price:9999,  blurb:'RSVP, schedule and gallery for a one-off occasion.', tag:'pink' },
  ];

  const FEATURES = [
    { id:'domain',      name:'Custom Domain Setup',            price:999,  blurb:'Connect and configure your own domain name.' },
    { id:'seo',         name:'SEO Optimisation Pack',          price:2499, blurb:'Meta tags, sitemap, structured data & speed tuning.' },
    { id:'dashboard',   name:'Admin Dashboard',                price:4999, blurb:'A private panel to edit content without touching code.' },
    { id:'payments',    name:'Payment Gateway Integration',    price:3999, blurb:'Accept UPI, cards and net-banking on your site.' },
    { id:'chat',        name:'Live Chat / WhatsApp Widget',    price:1499, blurb:'Let visitors message you directly from the site.' },
    { id:'cms',         name:'Blog / CMS Module',              price:2999, blurb:'Publish and manage posts without a developer.' },
    { id:'i18n',        name:'Multi-language Support',         price:3499, blurb:'Serve your site in more than one language.' },
    { id:'newsletter',  name:'Newsletter / Email Automation',  price:1999, blurb:'Capture emails and send automated sequences.' },
    { id:'aichat',      name:'AI Chatbot Integration',         price:5999, blurb:'A trained assistant that answers visitor questions.' },
    { id:'analytics',   name:'Advanced Analytics Dashboard',   price:2999, blurb:'Track visitors, funnels and conversions in one view.' },
    { id:'booking',     name:'Booking / Appointment System',   price:3999, blurb:'Let clients book slots directly on your site.' },
    { id:'social',      name:'Social Media Integration',       price:999,  blurb:'Live feeds and share buttons across the site.' },
    { id:'speed',       name:'Speed & Performance Pass',       price:1999, blurb:'Image, script and caching optimisation for fast loads.' },
    { id:'maintenance', name:'1-Year Maintenance & Support',   price:4999, blurb:'Updates, backups and priority support for 12 months.' },
  ];

  function formatINR(n){
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  // ---------------- Store ----------------
  function read(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return { siteType:null, features:[], meta:{} };
      const parsed = JSON.parse(raw);
      return {
        siteType: parsed.siteType || null,
        features: Array.isArray(parsed.features) ? parsed.features : [],
        meta: parsed.meta || {}
      };
    }catch(e){
      return { siteType:null, features:[], meta:{} };
    }
  }

  function write(state){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.dispatchEvent(new CustomEvent('nexora:cart-updated', { detail: state }));
  }

  function setSiteType(id){
    const state = read();
    state.siteType = id;
    write(state);
  }

  function toggleFeature(id){
    const state = read();
    const i = state.features.indexOf(id);
    if(i === -1) state.features.push(id); else state.features.splice(i,1);
    write(state);
    return state.features.includes(id);
  }

  function setMeta(patch){
    const state = read();
    state.meta = Object.assign({}, state.meta, patch);
    write(state);
  }

  function clear(){
    write({ siteType:null, features:[], meta:{} });
  }

  function getItemCount(){
    const state = read();
    return (state.siteType ? 1 : 0) + state.features.length;
  }

  function getSiteType(){
    const state = read();
    return SITE_TYPES.find(s => s.id === state.siteType) || null;
  }

  function getFeatures(){
    const state = read();
    return FEATURES.filter(f => state.features.includes(f.id));
  }

  function getTotals(){
    const site = getSiteType();
    const feats = getFeatures();
    const featuresTotal = feats.reduce((sum,f) => sum + f.price, 0);
    const subtotal = (site ? site.price : 0) + featuresTotal;
    const advance = Math.round(subtotal * ADVANCE_RATIO);
    const balance = subtotal - advance;
    return { siteTotal: site ? site.price : 0, featuresTotal, subtotal, advance, balance };
  }

  // ---------------- Tiny rule-based "AI advisor" ----------------
  // No external API key required — a lightweight recommender that
  // maps free-text goals to a site type + sensible starter features.
  // Swap this out for a real Claude/OpenAI API call from your backend
  // if you want true natural-language understanding (see README).
  function recommend(goalText){
    const t = (goalText || '').toLowerCase();
    const rules = [
      { test:/shop|sell|product|store|ecommerce|e-commerce/, type:'ecommerce', features:['payments','dashboard','seo','analytics'] },
      { test:/restaurant|cafe|café|food|menu/, type:'restaurant', features:['chat','booking','social'] },
      { test:/real ?estate|property|properties|flat|apartment/, type:'realestate', features:['dashboard','seo','chat'] },
      { test:/course|academy|teach|student|education|coaching/, type:'education', features:['dashboard','payments','cms'] },
      { test:/saas|startup|app|software|product launch/, type:'saas', features:['analytics','payments','aichat'] },
      { test:/blog|write|writer|newsletter/, type:'blog', features:['cms','newsletter','seo'] },
      { test:/wedding|event|party|rsvp/, type:'event', features:['social','booking'] },
      { test:/portfolio|freelance|business|company|agency|studio/, type:'business', features:['seo','chat','domain'] },
    ];
    for(const r of rules){
      if(r.test.test(t)){
        return { type: r.type, features: r.features };
      }
    }
    // default fallback
    return { type:'business', features:['seo','domain'] };
  }

  window.NexoraCart = {
    SITE_TYPES, FEATURES, ADVANCE_RATIO,
    formatINR,
    setSiteType, toggleFeature, setMeta, clear,
    getItemCount, getSiteType, getFeatures, getTotals,
    getState: read,
    recommend
  };

})(window);
