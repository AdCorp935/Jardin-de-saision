/* ==========================================================================
   Jardin de Saison — données et panier partagés entre l'accueil et le panier
   ========================================================================== */
(function () {
  'use strict';

  // Coordonnées de la boutique : un seul endroit à modifier.
  // WHATSAPP au format international sans « + » ni espaces (ex. 33612345678).
  // Laissé vide, le bouton WhatsApp ouvre le choix du contact.
  var CONTACT = {
    address: '98 rue Saint-Charles, 75015 Paris',
    phone: '01 42 92 04 21',
    whatsapp: '',
    email: ''
  };

  var W = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/';
  var IMG = {
    kaki: W + '7/78/Fuyu_persimmon_fruits%2C_one_cut_open.jpg/960px-Fuyu_persimmon_fruits%2C_one_cut_open.jpg',
    litchi: W + '4/46/Litchi_chinensis_fruits.JPG/960px-Litchi_chinensis_fruits.JPG',
    pitaya: W + '9/97/Dragon_fruit_%28Bangalore%2C_2025%29_02.jpg/960px-Dragon_fruit_%28Bangalore%2C_2025%29_02.jpg',
    mangue: W + '7/74/Mangos_-_single_and_halved.jpg/960px-Mangos_-_single_and_halved.jpg',
    clementine: W + '5/5d/Clementines_whole%2C_peeled%2C_half_and_sectioned.jpg/960px-Clementines_whole%2C_peeled%2C_half_and_sectioned.jpg',
    raisin: W + 'd/d9/Grapes%2C_Dry_Creek_Valley-7705.jpg/960px-Grapes%2C_Dry_Creek_Valley-7705.jpg',
    pakchoi: W + 'e/e5/Starr_080607-7271_Brassica_campestris_var._chinensis.jpg/960px-Starr_080607-7271_Brassica_campestris_var._chinensis.jpg',
    gingembre: W + 'f/f2/Fresh_Ginger.JPG/960px-Fresh_Ginger.JPG',
    citronnelle: W + '6/64/Cymbopogon_citratus_%28_Lemon_grass%29.jpg/960px-Cymbopogon_citratus_%28_Lemon_grass%29.jpg',
    shiitake: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Lentinula_edodes.jpg',
    daikon: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Daikon.Japan.jpg',
    coriandre: W + 'b/b7/Bunches_of_coriander_leaves.jpg/960px-Bunches_of_coriander_leaves.jpg',
    ramen: W + '6/62/Charsiu_ramen_02.jpg/960px-Charsiu_ramen_02.jpg',
    soja: W + '6/6e/Soy_sauce_with_wasabi.jpg/960px-Soy_sauce_with_wasabi.jpg',
    jasmin: W + '4/4b/Thai_jasmine_rice_uncooked.jpg/960px-Thai_jasmine_rice_uncooked.jpg',
    kimchi: W + '9/9d/Korean_cuisine-Kimchi-08.jpg/960px-Korean_cuisine-Kimchi-08.jpg',
    gyoza: W + '6/65/S%E1%BB%A7i_c%E1%BA%A3o_%E6%B0%B4%E9%A4%83_t%E1%BA%A1i_Qu%E1%BA%A3ng_Ch%C3%A2u_%E5%BB%A3%E5%B7%9E_%282019%29_%E2%80%93_1.jpg/960px-S%E1%BB%A7i_c%E1%BA%A3o_%E6%B0%B4%E9%A4%83_t%E1%BA%A1i_Qu%E1%BA%A3ng_Ch%C3%A2u_%E5%BB%A3%E5%B7%9E_%282019%29_%E2%80%93_1.jpg',
    the: W + '1/16/Loose_Jasmine_Tea_Leaves.jpg/960px-Loose_Jasmine_Tea_Leaves.jpg'
  };

  // [id, nom, catégorie, unité, prix, description]
  var PRODUCTS = [
    ['kaki', 'Kakis', 'fruits', 'la pièce', 0.9, 'Doux et fondants, la star de l’automne.'],
    ['litchi', 'Litchis', 'fruits', 'barquette 500 g', 4.5, 'Parfumés, à éplucher du bout des doigts.'],
    ['pitaya', 'Pitaya', 'fruits', 'la pièce', 3.5, 'Le fruit du dragon, chair blanche ou rose.'],
    ['mangue', 'Mangues', 'fruits', 'la pièce', 2.5, 'Juteuses, à croquer ou en salade.'],
    ['clementine', 'Clémentines', 'fruits', 'le kilo', 3.9, 'Sucrées et faciles à éplucher.'],
    ['raisin', 'Raisin', 'fruits', 'barquette 500 g', 2.9, 'Grains croquants, blancs ou noirs.'],
    ['pakchoi', 'Pak choï', 'legumes', 'la botte', 2.2, 'À sauter au wok avec ail et gingembre.'],
    ['gingembre', 'Gingembre', 'legumes', '250 g', 1.9, 'Frais et piquant, pour bouillons et marinades.'],
    ['citronnelle', 'Citronnelle', 'legumes', 'la botte', 1.5, 'L’âme des currys et des soupes thaï.'],
    ['shiitake', 'Shiitakés', 'legumes', 'barquette 250 g', 3.9, 'Frais, pour un umami profond.'],
    ['daikon', 'Daïkon', 'legumes', 'la pièce', 2.4, 'Radis blanc doux, cru ou mijoté.'],
    ['coriandre', 'Coriandre', 'legumes', 'la botte', 1.2, 'Fraîche, pour phở, salades et currys.'],
    ['ramen', 'Ramen', 'epicerie', 'le paquet', 1.8, 'Nouilles de blé pour bols fumants.'],
    ['soja', 'Sauce soja', 'epicerie', 'flacon 500 ml', 3.5, 'Claire, foncée, japonaise ou chinoise.'],
    ['jasmin', 'Riz jasmin', 'epicerie', 'sac 1 kg', 3.2, 'Grain long et parfumé.'],
    ['kimchi', 'Kimchi', 'epicerie', 'pot 400 g', 4.9, 'Chou fermenté coréen, piquant et vif.'],
    ['gyoza', 'Gyozas', 'epicerie', 'sachet surgelé', 4.5, 'À poêler, croustillants dessous.'],
    ['the', 'Thé au jasmin', 'epicerie', 'la boîte', 4.2, 'Thé vert délicatement fleuri.']
  ].map(function (r) {
    return { id: r[0], name: r[1], cat: r[2], unit: r[3], price: r[4], note: r[5], img: IMG[r[0]] };
  });
  var BY_ID = {};
  PRODUCTS.forEach(function (p) { BY_ID[p.id] = p; });

  var CAT_LABEL = { fruits: 'Fruit', legumes: 'Légume & herbe', epicerie: 'Épicerie' };

  /* ------------------------------ Panier (localStorage) ------------------------------ */
  var KEY = 'jds-cart';
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      var out = {};
      // On ne garde que des lignes valides : un panier corrompu ne doit pas casser la page.
      Object.keys(raw).forEach(function (id) {
        var it = raw[id];
        if (it && typeof it.price === 'number' && it.qty > 0) out[id] = it;
      });
      return out;
    } catch (e) { return {}; }
  }
  function save(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* navigation privée */ }
    listeners.forEach(function (fn) { fn(cart); });
  }
  var listeners = [];

  var cart = load();

  var Cart = {
    get: function () { return cart; },
    lines: function () { return Object.keys(cart).map(function (k) { return cart[k]; }).filter(function (it) { return it.qty > 0; }); },
    count: function () { return Cart.lines().reduce(function (s, it) { return s + it.qty; }, 0); },
    total: function () { return Cart.lines().reduce(function (s, it) { return s + it.price * it.qty; }, 0); },
    add: function (id, n) {
      var p = BY_ID[id] || cart[id];
      if (!p) return;
      var cur = cart[id] ? cart[id].qty : 0;
      cart[id] = { id: id, name: p.name, cat: p.cat, unit: p.unit, price: p.price, img: p.img || IMG[id], qty: Math.min(99, cur + (n || 1)) };
      save(cart);
    },
    set: function (id, q) {
      if (q <= 0) delete cart[id];
      else if (cart[id]) cart[id].qty = Math.min(99, q);
      save(cart);
    },
    clear: function () { cart = {}; save(cart); },
    onChange: function (fn) { listeners.push(fn); }
  };

  // Un autre onglet modifie le panier : on se resynchronise.
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    cart = load();
    listeners.forEach(function (fn) { fn(cart); });
  });

  /* ------------------------------ Formats ------------------------------ */
  var eurFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  function eur(n) { return eurFmt.format(n); }

  /* ------------------------------ Ouvert / fermé (heure de Paris) ------------------------------ */
  function openStatus() {
    var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var get = function (t) { return +parts.filter(function (x) { return x.type === t; })[0].value; };
    var m = (get('hour') % 24) * 60 + get('minute');
    var O = 8 * 60 + 30, C = 20 * 60;
    if (m >= O && m < C) {
      var left = C - m;
      return left <= 45
        ? { label: 'Ferme bientôt', sub: 'dans ' + left + ' min', color: '#ff8a14' }
        : { label: 'Ouvert maintenant', sub: 'jusqu’à 20h', color: '#7ed957' };
    }
    var wait = m < O ? O - m : 24 * 60 - m + O;
    return { label: 'Fermé', sub: wait <= 60 ? 'ouvre dans ' + wait + ' min' : m < O ? 'ouvre à 8h30' : 'ouvre demain à 8h30', color: '#e5484d' };
  }
  function paintStatus() {
    var st = openStatus();
    document.querySelectorAll('[data-open-label]').forEach(function (el) { el.textContent = st.label; });
    document.querySelectorAll('[data-open-sub]').forEach(function (el) { el.textContent = st.sub; });
    document.querySelectorAll('[data-open-dot]').forEach(function (el) { el.style.background = st.color; });
  }

  /* ------------------------------ Coordonnées dans la page ------------------------------ */
  function telHref() { return 'tel:' + CONTACT.phone.replace(/[^+\d]/g, ''); }
  function paintContact() {
    document.querySelectorAll('[data-address]').forEach(function (el) { el.textContent = CONTACT.address; });
    document.querySelectorAll('[data-phone]').forEach(function (el) { el.textContent = CONTACT.phone; });
    document.querySelectorAll('[data-tel]').forEach(function (el) { el.href = telHref(); });
  }

  /* ------------------------------ Compteurs du panier ------------------------------ */
  function paintCounts() {
    var n = Cart.count();
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = n; });
  }
  Cart.onChange(paintCounts);

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bump(selector) {
    if (reduceMotion) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    paintContact();
    paintStatus();
    paintCounts();
    setInterval(paintStatus, 30000);
  });

  window.JDS = {
    CONTACT: CONTACT, IMG: IMG, PRODUCTS: PRODUCTS, BY_ID: BY_ID, CAT_LABEL: CAT_LABEL,
    Cart: Cart, eur: eur, bump: bump, reduceMotion: reduceMotion
  };
})();
