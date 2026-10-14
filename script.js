const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#nav');
function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
}
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let chartFrame = null;
let chartIntro = null;

function renderChart(points) {
  const path = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join('');
  document.querySelector('#chart-line').setAttribute('d', path);
  document.querySelector('#chart-area').setAttribute('d', `${path}V175H40Z`);
  document.querySelectorAll('#chart-points circle').forEach((circle, index) => {
    circle.setAttribute('cx', points[index][0]);
    circle.setAttribute('cy', points[index][1]);
  });
}

function transitionChart(points) {
  cancelAnimationFrame(chartFrame);
  chartIntro?.cancel();
  if (reducedMotion.matches) { renderChart(points); return; }
  const from = Array.from(document.querySelectorAll('#chart-points circle'), circle => [
    Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy'))
  ]);
  const started = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - started) / 650);
    const ease = 1 - Math.pow(1 - progress, 3);
    renderChart(points.map(([x, y], index) => [
      from[index][0] + (x - from[index][0]) * ease,
      from[index][1] + (y - from[index][1]) * ease
    ]));
    if (progress < 1) chartFrame = requestAnimationFrame(tick);
    else chartFrame = null;
  }
  chartFrame = requestAnimationFrame(tick);
}

// Progressive enhancement: content stays visible if animation APIs are absent.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.section > div, .value > .eyebrow, .steps article, .roadmap-grid article, .materials > div').forEach((element, index) => {
    // Never hide an element that contains keyboard focus.
    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', `${(index % 3) * 65}ms`);
    observer.observe(element);
  });
  const chartObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    if (!reducedMotion.matches && chartFrame === null) {
      const line = document.querySelector('#chart-line');
      const length = line.getTotalLength();
      chartIntro = line.animate([
        { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
        { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 }
      ], { duration: 1300, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    chartObserver.disconnect();
  }, { threshold: 0.4 });
  chartObserver.observe(document.querySelector('.chart'));
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
    observer.disconnect();
    chartObserver.disconnect();
    chartIntro?.cancel();
  });
}

// All values below are illustrative, not real measurements.
const examples = {
  stable: {
    weights: [42, 48.8, 55.8, 62.6, 68.4],
    status: 'Положительная динамика',
    description: 'Вес растёт с 42 до 68,4 килограмма за 5 недель.',
    insight: 'В этом примере вес увеличивается при каждом измерении. История позволяет увидеть устойчивый рост.'
  },
  attention: {
    weights: [43, 49.6, 55.2, 55.4, 52.8],
    status: 'Обратить внимание',
    description: 'Вес сначала растёт, затем почти не меняется и снижается с 55,4 до 52,8 килограмма.',
    insight: 'В этом примере после замедления роста вес снижается. Такая динамика — повод для осмотра специалистом.'
  }
};
document.querySelectorAll('[data-animal]').forEach(button => {
  button.addEventListener('click', () => {
    const selected = button.dataset.animal;
    const example = examples[selected];
    document.querySelectorAll('[data-animal]').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    const points = example.weights.map((weight, index) => [40 + index * 103, 175 - (weight - 40) * 5]);
    transitionChart(points);
    document.querySelector('#weight').replaceChildren(
      document.createTextNode(example.weights.at(-1).toLocaleString('ru-RU') + ' '),
      Object.assign(document.createElement('small'), { textContent: 'кг' })
    );
    const status = document.querySelector('#status');
    status.textContent = example.status;
    status.classList.toggle('warn', selected === 'attention');
    document.querySelector('#chart-desc').textContent = example.description;
    document.querySelector('#insight-text').textContent = example.insight;
    if (!reducedMotion.matches) {
      const insight = document.querySelector('.insight');
      insight.getAnimations().forEach(animation => animation.cancel());
      insight.animate([{ opacity: 0.5, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 350, easing: 'ease-out' });
    }
  });
});
