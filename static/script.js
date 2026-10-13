// Тема 05 «Простір Товарів»: бургер-меню, выпадающее меню категорий, клиентский поиск,
// модалка заказа, галерея товара, сортировка, вкладки на карточке товара
(function () {
  'use strict';

  var hd = document.getElementById('hd');
  var burger = document.getElementById('burger');
  var cm = document.getElementById('catmenu');
  var cmBtn = document.getElementById('catmenu-btn');
  var cmPanel = document.getElementById('catmenu-panel');

  // --- Бургер: открывает нижний ряд шапки (меню) на мобильных ---
  if (burger && hd) {
    burger.addEventListener('click', function () {
      var open = hd.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.classList.toggle('is-open', open);
      document.body.classList.toggle('no-scroll', open && window.innerWidth <= 900);
      if (!open) closeCatmenu();
    });
  }

  // --- Меню «Категорії»: по клику (и по hover на десктопе через CSS) ---
  function closeCatmenu() {
    if (!cm) return;
    cm.classList.remove('is-open');
    if (cmBtn) cmBtn.setAttribute('aria-expanded', 'false');
  }
  if (cm && cmBtn && cmPanel) {
    cmBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var visible = getComputedStyle(cmPanel).display !== 'none';
      if (visible) {
        closeCatmenu();
        cm.classList.add('is-closed'); // гасим hover-показ, пока курсор не уйдёт с меню
      } else {
        cm.classList.remove('is-closed');
        cm.classList.add('is-open');
        cmBtn.setAttribute('aria-expanded', 'true');
      }
    });
    cm.addEventListener('mouseleave', function () { cm.classList.remove('is-closed'); });
    document.addEventListener('click', function (e) { if (!cm.contains(e.target)) closeCatmenu(); });
  }

  // --- Поиск: на /catalog/ фильтрует карточки, с других страниц форма уходит на /catalog/?q= ---
  var form = document.getElementById('search');
  var q = document.getElementById('q');
  if (form && q && document.body.dataset.page === 'catalog') {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.js-card'));
    var secs = Array.prototype.slice.call(document.querySelectorAll('.js-catsec'));
    var note = document.getElementById('filter-note');
    var noteQ = note ? note.querySelector('b') : null;
    var found = document.getElementById('found');

    function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/[’'`]/g, '').replace(/\s+/g, ' ').trim(); }
    function plural(n) {
      var a = n % 10, b = n % 100;
      if (a === 1 && b !== 11) return 'товар';
      if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'товари';
      return 'товарів';
    }
    function apply(val, pushUrl) {
      var words = norm(val).split(' ').filter(Boolean), n = 0;
      cards.forEach(function (c) {
        var name = norm(c.getAttribute('data-name'));
        var ok = words.every(function (w) { return name.indexOf(w) !== -1; });
        c.hidden = !ok;
        if (ok) n++;
      });
      secs.forEach(function (s) { s.hidden = !s.querySelector('.js-card:not([hidden])'); });
      if (found) found.textContent = (words.length ? 'Знайдено ' : '') + n + ' ' + plural(n);
      if (note) { note.hidden = !(words.length && n === 0); if (noteQ) noteQ.textContent = val.trim(); }
      document.body.classList.toggle('is-filtering', words.length > 0);
      if (pushUrl) {
        try { history.replaceState(null, '', words.length ? '?q=' + encodeURIComponent(val.trim()) : location.pathname); } catch (err) { /* без истории */ }
      }
    }
    var initial = '';
    try { initial = new URLSearchParams(location.search).get('q') || ''; } catch (err) { initial = ''; }
    if (initial) { q.value = initial; apply(initial, false); }
    q.addEventListener('input', function () { apply(q.value, true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); apply(q.value, true); q.blur(); });
    var reset = document.getElementById('filter-reset');
    if (reset) reset.addEventListener('click', function () { q.value = ''; apply('', true); q.focus(); });
  }

  // --- Модальное окно заказа ---
  var modal = document.getElementById('order-modal');
  var omProduct = document.getElementById('om-product');
  var omMail = document.getElementById('om-mail');
  function openModal(name, sku) {
    if (!modal) return;
    var label = name + (sku ? ' (код ' + sku + ')' : '');
    if (omProduct) omProduct.textContent = label;
    if (omMail) {
      var base = omMail.getAttribute('href').split('?')[0];
      omMail.setAttribute('href', base + '?subject=' + encodeURIComponent('Замовлення: ' + label) + '&body=' + encodeURIComponent('Доброго дня! Цікавить: ' + label + '\nКількість: \nТелефон для зв\'язку: '));
    }
    modal.hidden = false;
    document.body.classList.add('no-scroll');
  }
  function closeModal() {
    if (modal && !modal.hidden) { modal.hidden = true; document.body.classList.remove('no-scroll'); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.js-order');
    if (b) { e.preventDefault(); openModal(b.getAttribute('data-name') || '', b.getAttribute('data-sku') || ''); }
    if (e.target === modal || e.target.id === 'om-close') closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); closeCatmenu(); }
  });

  // --- Галерея товара ---
  var main = document.getElementById('gal-main');
  var thumbs = document.querySelectorAll('.gal__thumb');
  if (main && thumbs.length) {
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () {
        main.src = t.getAttribute('data-src');
        thumbs.forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
      });
    });
  }

  // --- Сортировка в категории ---
  var sort = document.getElementById('sort');
  var grid = document.getElementById('grid');
  if (sort && grid) {
    var items = Array.prototype.slice.call(grid.children);
    items.forEach(function (c, i) {
      c.dataset.i = i;
      c.dataset.p = parseFloat(c.getAttribute('data-price')) || 0;
      c.dataset.n = (c.querySelector('.card__name') || c).textContent.trim().toLowerCase();
    });
    sort.addEventListener('change', function () {
      var v = sort.value;
      items.sort(function (a, b) {
        if (v === 'price-asc') return a.dataset.p - b.dataset.p;
        if (v === 'price-desc') return b.dataset.p - a.dataset.p;
        if (v === 'name') return a.dataset.n < b.dataset.n ? -1 : (a.dataset.n > b.dataset.n ? 1 : 0);
        return a.dataset.i - b.dataset.i;
      });
      items.forEach(function (c) { grid.appendChild(c); });
    });
  }

  // --- Вкладки на карточке товара ---
  var tabs = document.getElementById('tabs');
  if (tabs) {
    var btns = Array.prototype.slice.call(tabs.querySelectorAll('.tabs__btn'));
    var panels = Array.prototype.slice.call(tabs.querySelectorAll('.tabs__panel'));
    function activate(id) {
      btns.forEach(function (b) {
        var on = b.getAttribute('aria-controls') === id;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (p) { p.hidden = p.id !== id; });
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { activate(b.getAttribute('aria-controls')); }); });
    document.querySelectorAll('.js-tab-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = (a.getAttribute('href') || '').slice(1);
        if (document.getElementById(id)) {
          e.preventDefault();
          activate(id);
          tabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    if (location.hash && document.getElementById(location.hash.slice(1)) && location.hash.indexOf('#tab-') === 0) activate(location.hash.slice(1));
  }
})();
