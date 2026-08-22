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
    { id:'business',       name:'Business / Portfolio',       price:15999, blurb:'A sharp, credible presence for a company, freelancer or studio.', tag:'red' },
    { id:'blog',           name:'Personal Blog',              price:15999, blurb:'A fast, clean writing space with categories and search.', tag:'blue' },
    { id:'resume',         name:'Resume / Personal CV',       price:16999, blurb:'A polished personal site to showcase your work and experience.', tag:'pink' },
    { id:'event',          name:'Event / Wedding',            price:17999, blurb:'RSVP, schedule and gallery for a one-off occasion.', tag:'red' },
    { id:'nonprofit',      name:'NGO / Nonprofit',            price:18999, blurb:'Mission storytelling, donation capture and volunteer sign-up.', tag:'blue' },
    { id:'photography',    name:'Photography Portfolio',      price:18999, blurb:'A gallery-first site built to showcase visual work beautifully.', tag:'pink' },
    { id:'salon',          name:'Salon / Spa',                price:19999, blurb:'Services menu, gallery and appointment enquiries.', tag:'red' },
    { id:'cleaning',       name:'Home Services / Cleaning',   price:19999, blurb:'Service areas, pricing and quick booking for local services.', tag:'blue' },
    { id:'petcare',        name:'Pet Care / Veterinary',      price:20999, blurb:'Services, staff bios and appointment booking for pet care.', tag:'pink' },
    { id:'gym',            name:'Gym / Fitness Studio',       price:20999, blurb:'Class schedules, trainer profiles and membership sign-up.', tag:'red' },
    { id:'restaurant',     name:'Restaurant / Café',          price:21999, blurb:'Menu, gallery and table/order enquiries with a warm feel.', tag:'blue' },
    { id:'coaching',       name:'Coaching / Tuition Institute', price:22999, blurb:'Course listings, faculty profiles and admission enquiries.', tag:'pink' },
    { id:'weddingplanner', name:'Wedding Planning Agency',    price:22999, blurb:'Portfolio, packages and enquiry capture for planners.', tag:'red' },
    { id:'interior',       name:'Interior Design Studio',     price:23999, blurb:'Project galleries and a refined, portfolio-led layout.', tag:'blue' },
    { id:'lawyer',         name:'Law Firm / Legal Services',  price:24999, blurb:'Practice areas, credentials and a professional, trustworthy tone.', tag:'pink' },
    { id:'travel',         name:'Travel Agency',              price:24999, blurb:'Destination pages, packages and enquiry/booking forms.', tag:'red' },
    { id:'clinic',         name:'Doctor / Clinic',            price:25999, blurb:'Services, doctor profiles and appointment booking.', tag:'blue' },
    { id:'agency',         name:'Design / Marketing Agency',  price:26999, blurb:'Case studies, services and a conversion-focused layout.', tag:'pink' },
    { id:'automobile',     name:'Car Dealership / Showroom',  price:27999, blurb:'Vehicle listings, filters and enquiry/test-drive capture.', tag:'red' },
    { id:'realestate',     name:'Real Estate',                price:27999, blurb:'Listings, filters and enquiry capture for properties.', tag:'blue' },
    { id:'subscription',   name:'Subscription Box Service',   price:29999, blurb:'Plan tiers, product previews and recurring sign-up flow.', tag:'pink' },
    { id:'saas',           name:'SaaS / Startup Landing',     price:29999, blurb:'Product story, pricing tiers and conversion-first layout.', tag:'red' },
    { id:'fintech',        name:'Finance / Fintech Landing',  price:31999, blurb:'Trust-first design for financial products and services.', tag:'blue' },
    { id:'education',      name:'Online Course / Academy',    price:32999, blurb:'Course pages, curriculum and student enquiry flow.', tag:'pink' },
    { id:'hotel',          name:'Hotel / Resort Booking',     price:34999, blurb:'Room listings, gallery and a full booking flow.', tag:'red' },
    { id:'jobportal',      name:'Job Portal',                 price:36999, blurb:'Listings, filters and applications for job seekers and employers.', tag:'blue' },
    { id:'ecommerce',      name:'E-Commerce Store',           price:38999, blurb:'Product catalog, cart and checkout for selling online.', tag:'pink' },
    { id:'healthcare',     name:'Healthcare / Telemedicine',  price:39999, blurb:'Doctor listings, consultations and patient records access.', tag:'red' },
    { id:'fooddelivery',   name:'Food Delivery Platform',     price:42999, blurb:'Restaurant listings, live ordering and delivery tracking.', tag:'blue' },
    { id:'marketplace',    name:'Multi-Vendor Marketplace',   price:45999, blurb:'Multiple sellers, product listings and a shared checkout.', tag:'pink' },
  ];

    const FEATURES = [
    { id:'domain',         name:'Custom Domain Setup',            price:999,  blurb:'Connect and configure your own domain name.' },
    { id:'seo',            name:'SEO Optimisation Pack',          price:2499, blurb:'Meta tags, sitemap, structured data & speed tuning.' },
    { id:'dashboard',      name:'Admin Dashboard',                price:4999, blurb:'A private panel to edit content without touching code.' },
    { id:'payments',       name:'Payment Gateway Integration',    price:3999, blurb:'Accept UPI, cards and net-banking on your site.' },
    { id:'chat',           name:'Live Chat / WhatsApp Widget',    price:1499, blurb:'Let visitors message you directly from the site.' },
    { id:'cms',            name:'Blog / CMS Module',              price:2999, blurb:'Publish and manage posts without a developer.' },
    { id:'i18n',           name:'Multi-language Support',         price:3499, blurb:'Serve your site in more than one language.' },
    { id:'newsletter',     name:'Newsletter / Email Automation',  price:1999, blurb:'Capture emails and send automated sequences.' },
    { id:'aichat',         name:'AI Chatbot Integration',         price:5999, blurb:'A trained assistant that answers visitor questions.' },
    { id:'analytics',      name:'Advanced Analytics Dashboard',   price:2999, blurb:'Track visitors, funnels and conversions in one view.' },
    { id:'booking',        name:'Booking / Appointment System',   price:3999, blurb:'Let clients book slots directly on your site.' },
    { id:'social',         name:'Social Media Integration',       price:999,  blurb:'Live feeds and share buttons across the site.' },
    { id:'speed',          name:'Speed & Performance Pass',       price:1999, blurb:'Image, script and caching optimisation for fast loads.' },
    { id:'maintenance',    name:'1-Year Maintenance & Support',   price:4999, blurb:'Updates, backups and priority support for 12 months.' },
    { id:'tour360',        name:'360° / Virtual Tour',            price:5999, blurb:'Immersive walkthroughs for properties, hotels and venues.' },
    { id:'financecalc',    name:'EMI / Finance Calculator',       price:2499, blurb:'Let visitors estimate monthly payments instantly.' },
    { id:'videoconsult',   name:'Video Consultation',             price:6999, blurb:'Secure video calls for clinics, coaching or advisory sites.' },
    { id:'eprescription',  name:'E-Prescription & Records',       price:4999, blurb:'Digital prescriptions and patient record access.' },
    { id:'livetracking',   name:'Live Order Tracking',            price:5999, blurb:'Real-time delivery or order status for customers.' },
    { id:'deliveryzones',  name:'Delivery Zone Management',       price:2999, blurb:'Define service areas and delivery radius by location.' },
    { id:'vendordash',     name:'Vendor / Multi-seller Dashboard', price:6999, blurb:'Let multiple sellers manage their own listings.' },
    { id:'payouts',        name:'Automated Payouts & Commission', price:5999, blurb:'Split and route payments to vendors automatically.' },
    { id:'kyc',            name:'KYC / Identity Verification',    price:4999, blurb:'Verify user identity for finance or marketplace flows.' },
    { id:'resumeupload',   name:'Resume Upload & Tracking',       price:4499, blurb:'Let applicants apply and get tracked through your pipeline.' },
    { id:'jobfilters',     name:'Advanced Job Filters',           price:2499, blurb:'Filter listings by role, location, salary and more.' },
    { id:'certificate',    name:'Certificate Generator',          price:2999, blurb:'Auto-generate completion certificates for students.' },
    { id:'onlineexam',     name:'Online Exam / Quiz Module',      price:4999, blurb:'Timed tests and quizzes with automatic scoring.' },
    { id:'donations',      name:'Donation Collection',            price:3999, blurb:'Accept one-time or recurring donations securely.' },
    { id:'volunteersignup',name:'Volunteer Sign-up Forms',        price:1999, blurb:'Let supporters register and pick shifts or roles.' },
    { id:'clientportal',   name:'Secure Client Portal',           price:5999, blurb:'A private login area for clients to track their work.' },
    { id:'documents',      name:'Document Upload & Storage',      price:2999, blurb:'Securely collect and store client documents.' },
    { id:'beforeafter',    name:'Before/After Image Slider',      price:2499, blurb:'Show transformations with an interactive comparison slider.' },
    { id:'guestlist',      name:'Guest List & RSVP Manager',      price:2999, blurb:'Track invitees, RSVPs and headcounts in one place.' },
    { id:'inventory',      name:'Inventory Management',           price:4999, blurb:'Track stock levels across products automatically.' },
    { id:'reviews',        name:'Customer Reviews & Ratings',     price:1999, blurb:'Let customers leave feedback that builds trust.' },
    { id:'loyalty',        name:'Loyalty / Rewards Program',      price:3999, blurb:'Reward repeat customers with points or perks.' },
  ];

  // Icon glyphs per catalog id — used to render icon badges on cards
  // across builder.html, pricing.html, and checkout summaries.
   const ICONS = {
    business:'💼', ecommerce:'🛍️', restaurant:'🍽️', realestate:'🏠',
    education:'🎓', saas:'⚡', blog:'✍️', event:'🎉',
    resume:'🪪', nonprofit:'🤝', photography:'📷', salon:'💇',
    cleaning:'🧹', petcare:'🐾', gym:'🏋️', coaching:'📚',
    weddingplanner:'💍', interior:'🛋️', lawyer:'⚖️', travel:'✈️',
    clinic:'🩺', agency:'🎯', automobile:'🚗', subscription:'📦',
    fintech:'💹', hotel:'🏨', jobportal:'🧑‍💼', healthcare:'⚕️',
    fooddelivery:'🛵', marketplace:'🏬',
    domain:'🌐', seo:'📈', dashboard:'🗂️', payments:'💳', chat:'💬',
    cms:'📝', i18n:'🌍', newsletter:'📧', aichat:'🤖', analytics:'📊',
    booking:'📅', social:'🔗', speed:'🚀', maintenance:'🛠️',
    tour360:'🌀', financecalc:'🧮', videoconsult:'🎥', eprescription:'💊',
    livetracking:'📍', deliveryzones:'🗺️', vendordash:'🏬', payouts:'💸',
    kyc:'🪪', resumeupload:'📎', jobfilters:'🔍', certificate:'📜',
    onlineexam:'🧪', donations:'🎗️', volunteersignup:'🙋', clientportal:'🔐',
    documents:'📁', beforeafter:'🔄', guestlist:'📋', inventory:'📦',
    reviews:'⭐', loyalty:'🎁'
  };

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
    SITE_TYPES, FEATURES, ADVANCE_RATIO, ICONS,
    formatINR,
    setSiteType, toggleFeature, setMeta, clear,
    getItemCount, getSiteType, getFeatures, getTotals,
    getState: read,
    recommend
  };

})(window);
