/* ==========================================================================
   Jardin de Saison — page panier
   ========================================================================== */
(function () {
  'use strict';

  var J = window.JDS;
  var Cart = J.Cart;
  var RM = J.reduceMotion;
  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  var SUGGEST = ['pakchoi', 'gingembre', 'coriandre', 'soja', 'kaki', 'gyoza', 'litchi'];
  var SLOTS = ['Aujourd’hui soir', 'Demain matin', 'Demain après-midi', 'Ce week-end'];

  var items = $('#items');
  var fName = $('#fName'), fPhone = $('#fPhone'), fWhen = $('#fWhen'), fNote = $('#fNote');
  var sent = false;
  var lastIds = '';

  /* ------------------------------ Lignes du panier ------------------------------ */
  function itemHTML(it) {
    return '<img src="' + (it.img || J.IMG[it.id] || '') + '" alt="">' +
      '<div class="item-main">' +
        '<div class="item-top"><span class="item-name"><strong>' + esc(it.name) + '</strong><small>' + J.eur(it.price) + ' · ' + esc(it.unit) + '</small></span>' +
        '<button type="button" class="item-x" data-remove aria-label="Retirer ' + esc(it.name) + '">×</button></div>' +
        '<div class="item-bottom"><div class="stepper stepper-cart"><button type="button" data-dec aria-label="Moins">−</button><span data-qty>' + it.qty + '</span><button type="button" data-inc aria-label="Plus">+</button></div>' +
        '<strong class="item-total" data-line>' + J.eur(it.price * it.qty) + '</strong></div>' +
      '</div>';
  }

  function render() {
    var list = Cart.lines();
    var has = list.length > 0;
    $('#emptyView').hidden = has;
    $('#fullView').hidden = !has;
    $('#titleTools').hidden = !has;

    var count = Cart.count();
    $('#countLabel').textContent = count + ' article' + (count > 1 ? 's' : '');
    $('#subtotal').textContent = J.eur(Cart.total());
    $('#total').textContent = J.eur(Cart.total());

    // On ne reconstruit les lignes que si la liste des produits change :
    // changer une quantité met juste à jour les chiffres, sans faire clignoter la page.
    var ids = list.map(function (it) { return it.id; }).join(',');
    if (ids !== lastIds) {
      var before = {};
      $$('.item', items).forEach(function (n) { before[n.getAttribute('data-id')] = true; });
      items.textContent = '';
      list.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'item';
        row.setAttribute('data-id', it.id);
        row.innerHTML = itemHTML(it);
        items.appendChild(row);
        if (lastIds && !before[it.id] && !RM) row.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: EASE });
      });
      lastIds = ids;
    } else {
      list.forEach(function (it) {
        var row = $('.item[data-id="' + it.id + '"]', items);
        if (!row) return;
        $('[data-qty]', row).textContent = it.qty;
        $('[data-line]', row).textContent = J.eur(it.price * it.qty);
      });
    }

    renderSuggest();
    paintSteps();
    paintLinks();
  }

  items.addEventListener('click', function (e) {
    var row = e.target.closest('.item');
    if (!row) return;
    var id = row.getAttribute('data-id');
    var it = Cart.get()[id];
    if (!it) return;
    if (e.target.closest('[data-inc]')) Cart.set(id, it.qty + 1);
    else if (e.target.closest('[data-dec]')) {
      if (it.qty <= 1) removeRow(row, id); else Cart.set(id, it.qty - 1);
    } else if (e.target.closest('[data-remove]')) removeRow(row, id);
  });

  function removeRow(row, id) {
    if (RM) { Cart.set(id, 0); return; }
    row.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-24px)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' })
      .onfinish = function () { Cart.set(id, 0); };
  }

  /* ------------------------------ Suggestions ------------------------------ */
  function renderSuggest() {
    var cart = Cart.get();
    var sug = SUGGEST.filter(function (id) { return !cart[id]; }).slice(0, 4).map(function (id) { return J.BY_ID[id]; });
    var has = Cart.lines().length > 0;
    var box = has ? $('#suggest') : $('#popular');
    $('#suggestBox').hidden = has && sug.length === 0;
    box.textContent = '';
    sug.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-add', p.id);
      if (has) {
        b.className = 'sug';
        b.innerHTML = '<span class="sug-img"><img src="' + p.img + '" alt="" loading="lazy"><span class="sug-plus">+</span></span><span class="sug-text"><strong>' + esc(p.name) + '</strong><small>' + J.eur(p.price) + '</small></span>';
        b.setAttribute('aria-label', 'Ajouter ' + p.name);
      } else {
        b.className = 'pop';
        b.innerHTML = '<img src="' + p.img + '" alt="" loading="lazy"><span class="pop-text"><strong>' + esc(p.name) + '</strong><small>' + J.eur(p.price) + ' · ' + esc(p.unit) + '</small></span><span class="pop-plus" aria-hidden="true">+</span>';
        b.setAttribute('aria-label', 'Ajouter ' + p.name);
      }
      box.appendChild(b);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b) return;
    Cart.add(b.getAttribute('data-add'), 1);
  });

  /* ------------------------------ Créneaux ------------------------------ */
  var slotsBox = $('#slots');
  SLOTS.forEach(function (s) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    b.textContent = s;
    b.addEventListener('click', function () { fWhen.value = fWhen.value === s ? '' : s; paintSlots(); paintLinks(); });
    slotsBox.appendChild(b);
  });
  function paintSlots() {
    $$('.slot', slotsBox).forEach(function (b) { b.classList.toggle('is-on', b.textContent === fWhen.value); });
  }

  /* ------------------------------ Étapes et liens d'envoi ------------------------------ */
  function paintSteps() {
    var stage = sent ? 2 : fName.value.trim() ? 1 : 0;
    $$('#cartSteps li').forEach(function (li, i) {
      li.classList.toggle('is-on', i <= stage);
      $('.cart-step-n', li).textContent = i < stage ? '✓' : String(i + 1);
    });
  }

  function message() {
    var list = Cart.lines();
    var out = ['Bonjour Jardin de Saison, je souhaite commander :', ''];
    list.forEach(function (it) { out.push('• ' + it.qty + ' × ' + it.name + ' (' + it.unit + ') : ' + J.eur(it.price * it.qty)); });
    out.push('', 'Total indicatif : ' + J.eur(Cart.total()), '', 'Nom : ' + fName.value.trim());
    if (fPhone.value.trim()) out.push('Téléphone : ' + fPhone.value.trim());
    if (fWhen.value.trim()) out.push('Retrait : ' + fWhen.value.trim());
    if (fNote.value.trim()) out.push('Note : ' + fNote.value.trim());
    return out.join('\n');
  }

  function paintLinks() {
    var msg = message();
    var wa = String(J.CONTACT.whatsapp || '').replace(/[^\d]/g, '');
    $('#sendWa').href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
    $('#sendMail').href = 'mailto:' + J.CONTACT.email + '?subject=' + encodeURIComponent('Commande – ' + (fName.value.trim() || 'Jardin de Saison')) + '&body=' + encodeURIComponent(msg);
  }

  [fName, fPhone, fWhen, fNote].forEach(function (f) {
    f.addEventListener('input', function () {
      if (f === fName) { $('#formErr').hidden = true; fName.classList.remove('is-err'); paintSteps(); }
      if (f === fWhen) paintSlots();
      paintLinks();
    });
  });

  $$('.send').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!fName.value.trim()) {
        e.preventDefault();
        $('#formErr').hidden = false;
        fName.classList.add('is-err');
        fName.focus();
        if (!RM) fName.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
        return;
      }
      paintLinks();
      sent = true;
      $('#sentBox').hidden = false;
      paintSteps();
    });
  });
  $('#orderForm').addEventListener('submit', function (e) { e.preventDefault(); });

  function clearAll() {
    Cart.clear();
    sent = false;
    $('#sentBox').hidden = true;
  }
  $('#clearCart').addEventListener('click', clearAll);
  $('#clearAfter').addEventListener('click', clearAll);

  Cart.onChange(render);
  render();
})();
