(function () {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasLibs = window.gsap && window.ScrollTrigger;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  if (reduced || !hasLibs) root.classList.add('no-anim');
  if (hasLibs) gsap.registerPlugin(ScrollTrigger);

  /* Menu: meteen naar de sectie springen, zonder scrollanimatie */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1), t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: 'instant' });
  }));
  const nav = $('[data-nav]'), burger = $('.nav__burger'), links = $('.nav__links');
  const toggleMenu = open => {
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('is-menu', open);
  };
  burger.addEventListener('click', () => toggleMenu(!links.classList.contains('is-open')));
  links.addEventListener('click', e => { if (e.target.closest('a')) toggleMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Dienst aangeklikt: vul het formulier alvast in */
  $$('[data-werk]').forEach(a => a.addEventListener('click', () => {
    const t = $('textarea[name=werken]');
    if (!t.value) t.value = a.dataset.werk;
  }));

  /* ---------- RICHTPRIJS ---------- */
  const MAT = {
    hellend: [['Dakpannen', 110], ['Natuurleien', 150], ['Kunstleien', 115]],
    plat: [['EPDM rubber', 90], ['Bitumen roofing', 90]],
    combi: [['Dakpannen + EPDM', 110], ['Natuurleien + EPDM', 150], ['Kunstleien + EPDM', 115]]
  };
  const COL = { Dakpannen: '#2b2d31', Natuurleien: '#3f4a55', Kunstleien: '#565a60', 'EPDM rubber': '#26282b', 'Bitumen roofing': '#3a3431' };
  const st = { dak: 'hellend', mat: 'Dakpannen', iso: '14', area: 120, asbest: false };
  const euro = n => '€ ' + new Intl.NumberFormat('nl-BE').format(Math.round(n / 50) * 50);
  const matBox = $('[data-name=mat]'), opp = $('#opp');
  function pressed(box, btn) { $$('button', box).forEach(b => b.setAttribute('aria-pressed', b === btn)); }
  function drawMat() {
    matBox.innerHTML = MAT[st.dak].map(([n], i) => `<button type="button" aria-pressed="${i === 0}" data-v="${n}">${n}</button>`).join('');
    st.mat = MAT[st.dak][0][0];
  }
  function house() {
    const w = 150 + (st.area - 20) / 380 * 170, x = 210 - w / 2, base = 188, wallH = 62, top = base - wallH;
    const col = COL[st.mat.split(' + ')[0]] || '#2b2d31', rh = 16 + w * .17;
    let roof;
    if (st.dak === 'plat') roof = `<rect x="${x - 7}" y="${top - 10}" width="${w + 14}" height="11" fill="${col}"/>`;
    else if (st.dak === 'combi') {
      const m = x + w * .62;
      roof = `<path d="M${x - 8} ${top}L${x + w * .31} ${top - rh}L${m + 6} ${top}Z" fill="${col}"/><rect x="${m}" y="${top + 8}" width="${x + w + 6 - m}" height="9" fill="#26282b"/>`;
    } else roof = `<path d="M${x - 11} ${top}L${x + w / 2} ${top - rh}L${x + w + 11} ${top}Z" fill="${col}"/>`;
    const iso = +st.iso ? `<path d="M${x - 2} ${top + 3}H${x + w + 2}" stroke="#ee7a3d" stroke-width="${2 + +st.iso / 5}"/>` : '';
    const wallTop = st.dak === 'combi' ? top : top;
    const h = base - wallTop;
    const winW = Math.max(26, w * .15);
    $('#houseSvg').innerHTML = `<path d="M6 ${base}H414" stroke="#141617" stroke-width="2"/><rect x="${x}" y="${wallTop}" width="${w}" height="${h}" fill="#b94917"/>${st.dak === 'combi' ? `<rect x="${x + w * .62}" y="${wallTop}" width="${w * .38}" height="16" fill="#f5f1e3"/>` : ''}${roof}${iso}<rect x="${x + w * .15}" y="${base - 42}" width="${winW}" height="27" fill="#f5f1e3"/><rect x="${x + w * .72}" y="${base - 42}" width="${winW}" height="27" fill="#f5f1e3"/>`;
  }
  /* Rekent met dezelfde voorbeeldtarieven als web.bloxflow.be/calculator */
  function calc() {
    const rate = MAT[st.dak].find(m => m[0] === st.mat)[1];
    const iso = +st.iso ? st.area * (+st.iso * 2 + 15) : 0;
    const total = st.area * rate + iso + (st.asbest ? st.area * 30 : 0);
    $('#low').textContent = euro(total * .9); $('#high').textContent = euro(total * 1.15);
    $('#oppO').textContent = st.area + ' m²';
    house();
  }
  $$('.opts').forEach(box => box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    pressed(box, b);
    const n = box.dataset.name;
    if (n === 'dak') { st.dak = b.dataset.v; drawMat(); }
    else if (n === 'mat') st.mat = b.dataset.v;
    else st.iso = b.dataset.v;
    calc();
  }));
  opp.addEventListener('input', () => { st.area = +opp.value; calc(); });
  $$('.quick button').forEach(b => b.addEventListener('click', () => { opp.value = b.dataset.q; st.area = +b.dataset.q; calc(); }));
  $('#asbest').addEventListener('change', e => { st.asbest = e.target.checked; calc(); });
  drawMat(); calc();
  $('#calcCta').addEventListener('click', () => {
    const txt = `${st.dak === 'combi' ? 'Combinatiedak' : st.dak === 'plat' ? 'Plat dak' : 'Hellend dak'}, ${st.area} m², ${st.mat}, isolatie ${+st.iso ? st.iso + ' cm' : 'al goed'}${st.asbest ? ', asbest verwijderen' : ''}. Start: ${$('#wanneer').value.toLowerCase()}.`;
    const box = $('.form__spec'); box.hidden = false; $('b', box).textContent = txt;
    const t = $('textarea[name=werken]');
    t.value = 'Graag een offerte voor: ' + txt;
  });

  /* ---------- FORMULIER (demo) ---------- */
  const form = $('.form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(i => {
      const bad = !i.value.trim() || (i.type === 'email' && !/.+@.+\..+/.test(i.value));
      i.classList.toggle('is-err', bad);
      if (bad && ok) i.focus();
      ok = ok && !bad;
    });
    if (ok) $('.form__ok', form).hidden = false;
  });

  /* ---------- DAKOPBOUW in isometrie ---------- */
  const svg = $('#roofSvg');
  const P = (x, y, z) => [380 + (x - y) * .866 * 3.15, 300 + (x + y) * .5 * 3.15 - 330 * .5 - z * 3.15].map(n => +n.toFixed(1));
  const pts = a => a.map(p => p.join(',')).join(' ');
  function slab(x0, y0, x1, y1, z0, z1, c, attrs = '') {
    const [t, l, r] = c;
    return `<polygon points="${pts([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)])}" fill="${t}" ${attrs}/>` +
      `<polygon points="${pts([P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)])}" fill="${l}" ${attrs}/>` +
      `<polygon points="${pts([P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)])}" fill="${r}" ${attrs}/>`;
  }
  const W = 100, D = 100;
  let g = '';
  // 1 kepers
  let beams = '';
  for (let i = 0; i < 7; i++) { const x = i * (W - 7) / 6; beams += slab(x, 0, x + 7, D, 0, 14, ['#c99a62', '#9a6f3e', '#ad8150']); }
  g += `<g class="ly">${beams}</g>`;
  // 2 dampscherm
  g += `<g class="ly">${slab(0, 0, W, D, 14, 15.5, ['#7c99ad', '#5c7789', '#688598'], 'opacity=".92"')}</g>`;
  // 3 sarking
  g += `<g class="ly">${slab(0, 0, W, D, 15.5, 33, ['#efe2b5', '#cdbb82', '#dbca93'])}</g>`;
  // 4 onderdak
  g += `<g class="ly">${slab(0, 0, W, D, 33, 34.6, ['#2a3c44', '#1c2a30', '#23333a'])}</g>`;
  // 5 dakpannen
  let tiles = '';
  const rows = 11, tw = W / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * tw;
    tiles += slab(0, y, W, y + tw - .4, 34.6, 39.5 + r * .02, [r % 2 ? '#26282c' : '#2f3237', '#17181b', '#1e2023']);
    for (let c = 1; c < 9; c++) { const x = c * W / 9; tiles += `<polyline points="${pts([P(x, y, 39.6), P(x, y + tw - .4, 39.6)])}" fill="none" stroke="#111214" stroke-width="1.3"/>`; }
  }
  g += `<g class="ly">${tiles}</g>`;
  // 6 oversteek en goot
  g += `<g class="ly">${slab(W, -2, W + 3, D + 2, 22, 40, ['#5a5e62', '#3f4347', '#4b4f53'])}${slab(W + 3, -4, W + 11, D + 4, 26, 33, ['#878c90', '#6d7276', '#7b8084'])}</g>`;
  svg.innerHTML = g;

  const lis = $$('.layers__list li'), ly = $$('.ly', svg);
  function layerState(active) {
    lis.forEach((li, i) => { li.classList.toggle('is-on', i === active); li.classList.toggle('is-done', i < active); });
  }

  if (reduced || !hasLibs) { root.classList.add('ready'); layerState(5); return; }

  /* ---------- HERO: een huisvormig raam opent tot het volle beeld ---------- */
  const media = $('.hero__media'), heroImg = $('img', media);
  const short = innerWidth < 700 ? [22, 78, 34, 48, 62] : [36, 64, 30, 46, 60];
  const [l, r, apex, eave, base] = short;
  gsap.set(media, { clipPath: `polygon(50% ${apex}%, ${r}% ${eave}%, ${r}% ${base}%, ${l}% ${base}%, ${l}% ${eave}%)` });
  gsap.set(heroImg, { scale: 1.16 });
  gsap.set($('.hero__shade'), { opacity: 0 });
  gsap.set('.ln>span', { yPercent: 110 });
  gsap.set(['.hero .kicker', '.hero__row'], { opacity: 0, y: 22 });
  gsap.set(nav, { yPercent: -100 });
  root.classList.add('ready');
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(media, { opacity: 0, duration: .5 }, .05)
    .to(media, { clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)', duration: 1.25, ease: 'expo.inOut' }, .55)
    .to(heroImg, { scale: 1, duration: 1.7, ease: 'expo.inOut' }, .4)
    .to($('.hero__shade'), { opacity: 1, duration: .8 }, 1.1)
    .to('.hero .kicker', { opacity: 1, y: 0, duration: .6 }, 1.25)
    .to('.ln>span', { yPercent: 0, duration: .9, stagger: .09 }, 1.25)
    .to('.hero__row', { opacity: 1, y: 0, duration: .7 }, 1.65)
    .to(nav, { yPercent: 0, duration: .7, clearProps: 'transform' }, 1.5);
  gsap.to(heroImg, { yPercent: -9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- REVEALS ---------- */
  ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: .9, stagger: .07, ease: 'power3.out' }) });
  $$('[data-parallax]').forEach(i => gsap.fromTo(i, { yPercent: -7 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: i.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* ---------- DIENSTEN: foto volgt de muis ---------- */
  const fl = $('.svc__float'), flImg = fl && $('img', fl);
  if (fl && matchMedia('(min-width:1000px) and (hover:hover)').matches) {
    const qx = gsap.quickTo(fl, 'x', { duration: .5, ease: 'power3' }), qy = gsap.quickTo(fl, 'y', { duration: .5, ease: 'power3' });
    addEventListener('mousemove', e => { qx(e.clientX - fl.offsetWidth * .5); qy(e.clientY - fl.offsetHeight * .55); });
    $$('.svc__row').forEach(row => {
      row.addEventListener('mouseenter', () => { flImg.src = `assets/img/${row.dataset.img}.webp`; gsap.to(fl, { opacity: 1, duration: .25 }); });
      row.addEventListener('mouseleave', () => gsap.to(fl, { opacity: 0, duration: .25 }));
    });
  }

  /* ---------- DAKOPBOUW op scroll ---------- */
  ly.forEach((el, i) => { if (i) { el.style.transform = 'translateY(-260px)'; el.style.opacity = 0; } });
  ScrollTrigger.create({
    trigger: '.layers', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate(s) {
      const n = ly.length, p = s.progress * n * 1.04;
      ly.forEach((el, i) => {
        const k = clamp(p - i), e = 1 - Math.pow(1 - k, 3);
        el.style.transform = `translateY(${(1 - e) * -260}px)`;
        el.style.opacity = clamp(k * 3);
      });
      layerState(Math.min(n - 1, Math.floor(p)));
    }
  });
  layerState(0);

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
