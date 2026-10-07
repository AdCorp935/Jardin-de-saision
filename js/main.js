/* ==========================================================================
   Jardin de Saison — page d'accueil
   ========================================================================== */
(function () {
  'use strict';

  var J = window.JDS;
  var Cart = J.Cart;
  var RM = J.reduceMotion;
  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  /* ------------------------------ Apparitions au défilement ------------------------------ */
  // L'état caché vient du CSS (.js [data-reveal]) : rien ne clignote avant l'animation.
  function reveal(node) {
    var d = +node.getAttribute('data-delay') || 0;
    node.style.transition = 'opacity 1s ' + EASE + ' ' + d + 'ms, translate 1s ' + EASE + ' ' + d + 'ms';
    node.classList.add('is-in');
    // Ensuite, on rend la main aux transitions de survol du CSS, sans délai.
    setTimeout(function () { node.style.transition = ''; }, d + 1050);
  }
  var io = !RM && 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      reveal(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }) : null;

  function observe(nodes) {
    nodes.forEach(function (n) {
      if (io) io.observe(n); else n.classList.add('is-in');
    });
  }
  observe($$('[data-reveal]'));

  /* ------------------------------ Accueil : lettres et zoom ------------------------------ */
  var hero = $('.hero');
  $$('[data-letter]').forEach(function (l, i) { l.style.transitionDelay = (150 + i * 70) + 'ms'; });
  requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-ready'); }); });

  /* ------------------------------ Texte qui s'allume mot à mot ------------------------------ */
  var wordsP = $('#words');
  var words = [];
  if (wordsP) {
    var text = wordsP.textContent.trim().split(/\s+/);
    wordsP.textContent = '';
    text.forEach(function (w, i) {
      var s = el('span', 'word' + (i >= 17 && i <= 20 ? ' word-hl' : ''));
      s.textContent = w;
      wordsP.appendChild(s);
      wordsP.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }

  /* ------------------------------ Défilement : barre, en-tête, parallaxe ------------------------------ */
  var progress = $('#progress');
  var topnav = $('#topnav');
  var heroZoom = $('#heroZoom');
  var fab = $('#fab');
  var scrolled = null;
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = Math.max(1, document.documentElement.scrollHeight - vh);
    progress.style.transform = 'scaleX(' + Math.min(1, y / max) + ')';

    if (!RM && y < hero.offsetHeight) {
      // Le zoom part du bas : l'image grandit vers le haut pendant qu'elle descend, sans laisser de vide.
      heroZoom.style.transform = 'translate3d(0,' + (y * 0.25).toFixed(1) + 'px,0) scale(' + (1 + Math.min(y, 1200) / 2400).toFixed(4) + ')';
    }

    if (words.length) {
      if (RM) words.forEach(function (w) { w.style.opacity = 1; });
      else {
        var b = wordsP.getBoundingClientRect();
        var pr = Math.max(0, Math.min(1, (vh * 0.85 - b.top) / (b.height + vh * 0.35)));
        var lit = pr * words.length * 1.05;
        words.forEach(function (w, i) { w.style.opacity = Math.max(0.18, Math.min(1, lit - i)); });
      }
    }

    var s = y > vh * 0.8;
    if (s !== scrolled) {
      scrolled = s;
      topnav.classList.toggle('is-shown', s);
      paintFab();
    }
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  /* ------------------------------ Menu plein écran ------------------------------ */
  var menu = $('#menu');
  var openers = $$('[data-menu-open]');
  var lastFocus = null;
  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    document.body.classList.add('no-scroll');
    openers.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
    $('[data-menu-close]', menu).focus();
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    openers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, RM ? 0 : 450);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  openers.forEach(function (b) { b.addEventListener('click', openMenu); });
  $('[data-menu-close]', menu).addEventListener('click', closeMenu);
  $$('.menu-links a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ------------------------------ Étals : catalogue, recherche, ajout ------------------------------ */
  var grid = $('#products');
  var search = $('#search');
  var noRes = $('#noResults');
  var cat = 'all';
  var qtys = {};
  var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var BAG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';

  function renderProducts() {
    var q = norm(search.value.trim());
    var list = J.PRODUCTS.filter(function (p) {
      return (cat === 'all' || p.cat === cat) && (!q || norm(p.name + ' ' + p.note).indexOf(q) !== -1);
    });
    grid.textContent = '';
    noRes.hidden = list.length > 0;
    var cards = list.map(function (p, i) {
      var c = el('div', 'product-wrap');
      c.setAttribute('data-reveal', '');
      c.setAttribute('data-delay', (i % 4) * 90);
      c.innerHTML =
        '<article class="product" data-id="' + p.id + '">' +
          '<div class="product-img product-' + p.cat + '">' +
            '<img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy">' +
            '<span class="product-cat">' + J.CAT_LABEL[p.cat] + '</span>' +
            '<span class="product-in" hidden></span>' +
          '</div>' +
          '<div class="product-body"><h3>' + esc(p.name) + '</h3><p>' + esc(p.note) + '</p></div>' +
          '<div class="product-foot">' +
            '<div class="price"><strong>' + J.eur(p.price) + '</strong><small>' + esc(p.unit) + '</small></div>' +
            '<div class="buy">' +
              '<div class="stepper"><button type="button" data-dec aria-label="Moins de ' + esc(p.name) + '">−</button><span data-qty>' + (qtys[p.id] || 1) + '</span><button type="button" data-inc aria-label="Plus de ' + esc(p.name) + '">+</button></div>' +
              '<button type="button" class="add" data-add aria-label="Ajouter ' + esc(p.name) + ' au panier">' + BAG + '</button>' +
            '</div>' +
          '</div>' +
        '</article>';
      grid.appendChild(c);
      return c;
    });
    paintInCart();
    observe(cards);
  }

  function paintInCart() {
    var cart = Cart.get();
    $$('.product', grid).forEach(function (a) {
      var it = cart[a.getAttribute('data-id')];
      var b = $('.product-in', a);
      b.hidden = !it;
      if (it) b.textContent = '✓ ' + it.qty + ' dans le panier';
    });
  }

  grid.addEventListener('click', function (e) {
    var a = e.target.closest('.product');
    if (!a) return;
    var id = a.getAttribute('data-id');
    var q = qtys[id] || 1;
    if (e.target.closest('[data-inc]')) q = Math.min(99, q + 1);
    else if (e.target.closest('[data-dec]')) q = Math.max(1, q - 1);
    else if (e.target.closest('[data-add]')) {
      Cart.add(id, q);
      qtys[id] = 1;
      $('[data-qty]', a).textContent = 1;
      showToast(J.BY_ID[id].name);
      J.bump('[data-cartbtn], .fab-count');
      if (!RM) e.target.closest('[data-add]').animate([{ transform: 'scale(1)' }, { transform: 'scale(.85) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 380, easing: EASE });
      return;
    } else return;
    qtys[id] = q;
    $('[data-qty]', a).textContent = q;
  });

  var searchTimer;
  search.addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(renderProducts, 120); });
  $('#clearSearch').addEventListener('click', function () { search.value = ''; renderProducts(); search.focus(); });

  var catTabs = $$('#catTabs [data-cat]');
  function setCat(c) {
    cat = c;
    catTabs.forEach(function (b) {
      var on = b.getAttribute('data-cat') === c;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    renderProducts();
  }
  catTabs.forEach(function (b) { b.addEventListener('click', function () { setCat(b.getAttribute('data-cat')); }); });
  // Les rayons de l'épicerie ouvrent directement la bonne catégorie.
  $$('[data-cat-link]').forEach(function (a) { a.addEventListener('click', function () { search.value = ''; setCat(a.getAttribute('data-cat-link')); }); });

  renderProducts();

  /* ------------------------------ Toast et panier flottant ------------------------------ */
  var toast = $('#toast');
  var toastOn = false;
  var toastTimer;
  function showToast(name) {
    $('#toastName').textContent = name;
    toastOn = true;
    toast.classList.add('is-on');
    paintFab();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastOn = false; toast.classList.remove('is-on'); paintFab(); }, 2800);
  }
  function paintFab() {
    $('#fabTotal').textContent = J.eur(Cart.total());
    fab.classList.toggle('is-on', Cart.count() > 0 && !!scrolled && !toastOn);
  }
  Cart.onChange(function () { paintInCart(); paintFab(); });
  paintFab();

  /* ------------------------------ Calendrier des saisons ------------------------------ */
  var MN = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var MS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  var F = [['Fraise', [3, 4, 5, 6]], ['Cerise', [4, 5, 6]], ['Abricot', [5, 6, 7]], ['Melon', [5, 6, 7, 8]], ['Pêche', [5, 6, 7, 8]], ['Figue', [7, 8, 9]], ['Raisin', [7, 8, 9]], ['Pomme', [0, 1, 2, 7, 8, 9, 10, 11]], ['Poire', [0, 1, 7, 8, 9, 10, 11]], ['Kaki', [9, 10, 11]], ['Châtaigne', [9, 10, 11]], ['Clémentine', [0, 1, 10, 11]], ['Kiwi', [0, 1, 2, 3, 10, 11]], ['Litchi', [0, 11]]];
  var V = [['Radis', [2, 3, 4, 5]], ['Asperge', [3, 4, 5]], ['Petits pois', [4, 5, 6]], ['Tomate', [5, 6, 7, 8]], ['Courgette', [5, 6, 7, 8]], ['Aubergine', [6, 7, 8]], ['Patate douce', [8, 9, 10]], ['Champignons', [8, 9, 10]], ['Potiron', [8, 9, 10, 11]], ['Épinard', [2, 3, 4, 8, 9, 10]], ['Poireau', [0, 1, 2, 8, 9, 10, 11]], ['Endive', [0, 1, 2, 9, 10, 11]], ['Chou', [0, 1, 2, 9, 10, 11]]];
  var T = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/';
  var CI = {
    'Fraise': '0/0a/Owoce_Truskawka.jpg/500px-Owoce_Truskawka.jpg', 'Cerise': '4/40/Bing_Cherries_%28USDA_ARS%29.jpg/500px-Bing_Cherries_%28USDA_ARS%29.jpg',
    'Abricot': '2/2a/Apricot_and_cross_section.jpg/500px-Apricot_and_cross_section.jpg', 'Melon': 'e/e7/Cantaloupe_and_canary_melon.jpg/500px-Cantaloupe_and_canary_melon.jpg',
    'Pêche': 'd/d5/Flameprince_peaches.jpg/500px-Flameprince_peaches.jpg', 'Figue': '9/9c/Grappe_de_figues.jpg/500px-Grappe_de_figues.jpg',
    'Raisin': 'd/d9/Grapes%2C_Dry_Creek_Valley-7705.jpg/500px-Grapes%2C_Dry_Creek_Valley-7705.jpg', 'Pomme': '5/53/Owoce_Jab%C5%82ko.jpg/500px-Owoce_Jab%C5%82ko.jpg',
    'Poire': 'a/af/Owoce_Gruszka.jpg/500px-Owoce_Gruszka.jpg', 'Kaki': '7/78/Fuyu_persimmon_fruits%2C_one_cut_open.jpg/500px-Fuyu_persimmon_fruits%2C_one_cut_open.jpg',
    'Châtaigne': 'd/dc/Ch%C3%A2taignes_dans_leurs_bogues_sur_la_branche_d%27un_ch%C3%A2taignier.jpg/500px-Ch%C3%A2taignes_dans_leurs_bogues_sur_la_branche_d%27un_ch%C3%A2taignier.jpg',
    'Clémentine': '5/5d/Clementines_whole%2C_peeled%2C_half_and_sectioned.jpg/500px-Clementines_whole%2C_peeled%2C_half_and_sectioned.jpg',
    'Kiwi': 'b/b8/Kiwi_%28Actinidia_chinensis%29_1_Luc_Viatour.jpg/500px-Kiwi_%28Actinidia_chinensis%29_1_Luc_Viatour.jpg', 'Litchi': '4/46/Litchi_chinensis_fruits.JPG/500px-Litchi_chinensis_fruits.JPG',
    'Radis': 'a/a9/Radish_bunches.jpg/500px-Radish_bunches.jpg', 'Asperge': '4/44/Spargel_-_Asparagus.jpg/500px-Spargel_-_Asparagus.jpg',
    'Petits pois': 'e/e1/Peas.jpg/500px-Peas.jpg', 'Tomate': '3/38/Ripe_Red_Tomatoes.jpg/500px-Ripe_Red_Tomatoes.jpg',
    'Courgette': '5/51/Courgette_Cucurbita_pepo_2.jpg/500px-Courgette_Cucurbita_pepo_2.jpg', 'Aubergine': 'f/fc/Solanum_melongena_26_08_2012_%281%29.JPG/500px-Solanum_melongena_26_08_2012_%281%29.JPG',
    'Patate douce': '0/0b/Pile_of_Sweet_Potatoes_at_Barkin_Dogo_Market%2C_Kaduna_North_01.jpg/500px-Pile_of_Sweet_Potatoes_at_Barkin_Dogo_Market%2C_Kaduna_North_01.jpg',
    'Champignons': 'f/ff/Champignons_Agaricus.jpg/500px-Champignons_Agaricus.jpg', 'Potiron': '4/49/Bu%C4%8De.jpg/500px-Bu%C4%8De.jpg',
    'Épinard': '5/56/Fresh_Spinach_leaves.jpg/500px-Fresh_Spinach_leaves.jpg', 'Poireau': '8/81/Poireaux.JPG/500px-Poireaux.JPG',
    'Endive': 'd/db/Witlof_en_wortel.jpg/500px-Witlof_en_wortel.jpg', 'Chou': '8/8a/Brassica_oleracea_Helgoland4.jpg/500px-Brassica_oleracea_Helgoland4.jpg'
  };
  Object.keys(CI).forEach(function (k) { CI[k] = T + CI[k]; });

  var nowMonth = new Date().getMonth();
  var month = nowMonth;
  var calCat = 'fruits';
  var monthsBox = $('#months');
  var featuredBox = $('#featured');
  var yearHead = $('#yearHead');
  var yearRows = $('#yearRows');

  MS.forEach(function (m, i) {
    var b = el('button', 'month');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', MN[i]);
    b.innerHTML = m + (i === nowMonth ? '<span class="month-dot"></span>' : '');
    b.addEventListener('click', function () { setMonth(i); });
    monthsBox.appendChild(b);
  });
  yearHead.appendChild(el('span'));
  MS.forEach(function (m) { yearHead.appendChild(el('span', 'year-m', m)); });

  function buildRows() {
    yearRows.textContent = '';
    (calCat === 'fruits' ? F : V).forEach(function (r) {
      var S = r[1];
      var row = el('div', 'year-row');
      row.setAttribute('data-months', S.join(','));
      row.innerHTML = '<span class="year-name"><img src="' + CI[r[0]] + '" alt="" loading="lazy">' + r[0] + '</span>';
      for (var i = 0; i < 12; i++) {
        var a = S.indexOf(i) !== -1, p = i > 0 && S.indexOf(i - 1) !== -1, n = i < 11 && S.indexOf(i + 1) !== -1;
        var cell = el('div', 'year-cell');
        var bar = el('div', 'year-bar' + (a ? ' is-on' : ''));
        // Les mois consécutifs forment une seule barre continue, arrondie aux extrémités.
        bar.style.borderRadius = (p ? '0' : '999px') + ' ' + (n ? '0' : '999px') + ' ' + (n ? '0' : '999px') + ' ' + (p ? '0' : '999px');
        cell.appendChild(bar);
        row.appendChild(cell);
      }
      yearRows.appendChild(row);
    });
    paintRows();
  }
  function paintRows() {
    $$('.year-m', yearHead).forEach(function (s, i) { s.classList.toggle('is-cur', i === month); });
    $$('.year-row', yearRows).forEach(function (row) {
      var S = row.getAttribute('data-months').split(',').map(Number);
      var on = S.indexOf(month) !== -1;
      row.classList.toggle('is-dim', !on);
      $$('.year-cell', row).forEach(function (c, i) {
        c.classList.toggle('is-cur', i === month);
        var bar = c.firstChild;
        bar.classList.toggle('is-month', i === month && S.indexOf(i) !== -1);
      });
    });
  }

  function renderFeatured(animate) {
    var all = F.map(function (x) { return [x[0], x[1], 'Fruit']; }).concat(V.map(function (x) { return [x[0], x[1], 'Légume']; }));
    var list = all.filter(function (x) { return x[1].indexOf(month) !== -1; });
    featuredBox.textContent = '';
    list.forEach(function (x, i) {
      var S = x[1];
      var l = month, n = 0;
      while (S.indexOf((l + 1) % 12) !== -1 && n < 11) { l = (l + 1) % 12; n++; }
      var isNew = S.indexOf((month + 11) % 12) === -1;
      var card = el('div', 'feat');
      card.innerHTML =
        '<div class="feat-img"><img src="' + CI[x[0]] + '" alt="' + esc(x[0]) + '" loading="lazy">' + (isNew ? '<span class="feat-new">Nouveau</span>' : '') + '</div>' +
        '<div class="feat-body"><span class="feat-name">' + esc(x[0]) + '</span><span class="feat-meta">' + x[2] + ' · ' + (l === month ? 'dernier mois' : 'jusqu’en ' + MN[l].toLowerCase()) + '</span></div>';
      featuredBox.appendChild(card);
      if (animate && !RM) card.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: i * 50, easing: EASE, fill: 'backwards' });
    });
    featuredBox.scrollTo({ left: 0, behavior: RM ? 'auto' : 'smooth' });
    $('#nowFruits').textContent = F.filter(function (r) { return r[1].indexOf(month) !== -1; }).length;
    $('#nowVeg').textContent = V.filter(function (r) { return r[1].indexOf(month) !== -1; }).length;
  }

  function setMonth(m, first) {
    month = (m + 12) % 12;
    var mn = $('#monthName');
    mn.textContent = MN[month].toLowerCase();
    if (!first && !RM) mn.animate([{ opacity: 0, transform: 'translateY(.25em)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: EASE });
    $$('.month', monthsBox).forEach(function (b, i) {
      var on = i === month;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    // Sur mobile, la bande des mois défile : on garde le mois choisi visible.
    var cur = monthsBox.children[month];
    if (cur && monthsBox.scrollWidth > monthsBox.clientWidth) {
      monthsBox.scrollTo({ left: cur.offsetLeft - monthsBox.clientWidth / 2 + cur.offsetWidth / 2, behavior: first || RM ? 'auto' : 'smooth' });
    }
    renderFeatured(!first);
    paintRows();
  }
  $('#prevMonth').addEventListener('click', function () { setMonth(month - 1); });
  $('#nextMonth').addEventListener('click', function () { setMonth(month + 1); });

  var calTabs = $$('#calTabs [data-calcat]');
  calTabs.forEach(function (b) {
    b.addEventListener('click', function () {
      calCat = b.getAttribute('data-calcat');
      calTabs.forEach(function (x) { x.classList.toggle('is-on', x === b); });
      buildRows();
    });
  });
  buildRows();
  setMonth(month, true);

  /* ------------------------------ Conversation de commande animée ------------------------------ */
  var chat = $('#chat');
  var stepBtns = $$('#steps .step');
  var DEFAULT_LINES = [['kaki', 3], ['litchi', 1], ['pakchoi', 2], ['gyoza', 1]];
  var lines = [];
  var cp = 0;
  var chatTimer = null;
  var chatVisible = false;

  function computeLines() {
    // Sur petit écran, le téléphone est moins haut : la conversation tient en 3 produits.
    var max = window.innerWidth < 640 ? 3 : 4;
    var fromCart = Cart.lines();
    var src = fromCart.length >= 3
      ? fromCart.slice(0, max).map(function (it) { return { name: it.name, n: it.qty, unit: it.unit, price: it.price, img: it.img || J.IMG[it.id] }; })
      : DEFAULT_LINES.slice(0, max).map(function (d) { var p = J.BY_ID[d[0]]; return { name: p.name, n: d[1], unit: p.unit, price: p.price, img: p.img }; });
    lines = src;
  }

  function pop(node) {
    if (RM) return;
    node.animate([{ opacity: 0, transform: 'translateY(14px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: EASE });
  }

  // Construit la conversation telle qu'elle est à l'étape « c ». Seuls les éléments nouveaux s'animent.
  var shown = {};
  function renderChat(c, animate) {
    var L = lines.length, R = L + 2;
    var n = Math.max(0, Math.min(L, c - 1));
    var next = {};
    var frag = document.createDocumentFragment();

    function keep(key, build) {
      var node = shown[key] || build();
      next[key] = node;
      frag.appendChild(node);
      if (!shown[key] && animate) pop(node);
      return node;
    }

    if (c < R + 2) keep('date', function () { return el('span', 'chat-date', 'Aujourd’hui'); });
    if (c >= 1) {
      var bubble = keep('bubble', function () {
        return el('div', 'chat-order',
          '<div class="chat-order-head"><span>Bonjour, je souhaite commander :</span><span class="chat-count"></span></div>' +
          '<div class="chat-lines"></div><div class="chat-total" hidden><span class="chat-total-row"><span class="chat-total-word"></span><strong class="chat-total-sum"></strong></span><span class="chat-pickup" hidden><span class="dot dot-green"></span>Retrait en boutique : demain vers 18h</span></div>' +
          '<span class="chat-time">12:04<span class="chat-ticks"></span></span>');
      });
      var box = $('.chat-lines', bubble);
      while (box.children.length > n) box.removeChild(box.lastChild);
      for (var i = box.children.length; i < n; i++) {
        var l = lines[i];
        var row = el('div', 'chat-line',
          '<span class="chat-thumb"><img src="' + l.img + '" alt=""><span>' + l.n + '</span></span>' +
          '<span class="chat-line-name"><strong>' + esc(l.name) + '</strong><small>' + esc(l.unit) + '</small></span>' +
          '<span class="chat-line-price">' + J.eur(l.n * l.price) + '</span>');
        box.appendChild(row);
        if (animate) pop(row);
      }
      $('.chat-count', bubble).textContent = n + ' / ' + L + (L > 1 ? ' articles' : ' article');
      var tot = $('.chat-total', bubble);
      tot.hidden = c < 2;
      $('.chat-total-word', bubble).textContent = c >= R ? 'Total indicatif' : 'Sous-total';
      $('.chat-total-sum', bubble).textContent = J.eur(lines.slice(0, n).reduce(function (s, x) { return s + x.n * x.price; }, 0));
      var pick = $('.chat-pickup', bubble);
      if (pick.hidden && c >= R && animate) { pick.hidden = false; pop(pick); }
      pick.hidden = c < R;
      var ticks = $('.chat-ticks', bubble);
      ticks.textContent = c >= R ? '✓✓' : '✓';
      ticks.classList.toggle('is-read', c >= R + 1);
    }
    if (c === R + 1) keep('typing', function () { return el('div', 'chat-typing', '<span></span><span></span><span></span>'); });
    if (c >= R + 2) keep('reply', function () { return el('div', 'chat-reply', '<span>Bien reçu, merci ! Votre commande sera prête demain à 18h.</span><span class="chat-time chat-time-light">12:06</span>'); });
    if (c >= R + 3) keep('ready', function () { return el('div', 'chat-ready', '<span>✓</span>Commande prête au comptoir'); });

    chat.textContent = '';
    chat.appendChild(frag);
    shown = next;

    var st = c < R ? 0 : c < R + 2 ? 1 : 2;
    stepBtns.forEach(function (b, i) { b.classList.toggle('is-on', i === st); });
    $('#stepNum').textContent = st + 1;
    $('#chatStatus').textContent = c === R + 1 ? 'en train d’écrire…' : 'en ligne';
  }

  function delayFor(c) {
    var R = lines.length + 2;
    return c === 0 ? 500 : c === 1 ? 800 : c < R ? 420 : c === R ? 1000 : c === R + 1 ? 1500 : c === R + 2 ? 1000 : 4500;
  }
  function advance() {
    clearTimeout(chatTimer);
    if (!chatVisible) return;
    chatTimer = setTimeout(function () {
      var R = lines.length + 2;
      if (cp >= R + 3) { cp = 0; computeLines(); shown = {}; } else cp++;
      renderChat(cp, true);
      advance();
    }, delayFor(cp));
  }

  computeLines();
  if (RM) {
    cp = lines.length + 5;
    renderChat(cp, false);
  } else {
    renderChat(0, false);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          chatVisible = e.isIntersecting;
          if (chatVisible) { if (cp === 0) computeLines(); advance(); } else clearTimeout(chatTimer);
        });
      }, { threshold: 0.3 }).observe($('#commander'));
    }
  }
  stepBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      var R = lines.length + 2;
      cp = [1, R, R + 2][i];
      shown = {};
      renderChat(cp, false);
      advance();
    });
  });

  /* ------------------------------ Visite : copier l'adresse ------------------------------ */
  var copyBtn = $('#copyAddress');
  copyBtn.addEventListener('click', function () {
    var txt = 'Jardin de Saison, ' + J.CONTACT.address;
    var done = function () {
      copyBtn.textContent = 'Adresse copiée ✓';
      setTimeout(function () { copyBtn.textContent = 'Copier l’adresse'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
    else done();
  });

  /* ------------------------------ Demandes de devis ------------------------------ */
  $$('[data-quote]').forEach(function (a) {
    var s = a.getAttribute('data-quote');
    a.href = 'mailto:' + J.CONTACT.email + '?subject=' + encodeURIComponent('Demande de devis – ' + s) +
      '&body=' + encodeURIComponent('Bonjour Jardin de Saison,\n\nJe souhaiterais un devis pour : ' + s.toLowerCase() + '.\nDate / fréquence :\nNombre de personnes :\nBudget indicatif :\n\nMerci !');
  });
})();
