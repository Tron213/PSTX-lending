// Элементы меню.
const menuButton = document.querySelector(
  '.menu-toggle',
);
const navigation =
  document.querySelector('#nav');
function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute(
    'aria-expanded',
    'false',
  );
  menuButton.setAttribute(
    'aria-label',
    'Открыть меню',
  );
}
function toggleMenu() {
  const open =
    navigation.classList.toggle('open');
  const label = open
    ? 'Закрыть меню'
    : 'Открыть меню';
  menuButton.setAttribute(
    'aria-expanded',
    String(open),
  );
  menuButton.setAttribute(
    'aria-label',
    label,
  );
}
menuButton.addEventListener(
  'click',
  toggleMenu,
);
navigation
  .querySelectorAll('a')
  .forEach((link) => {
    link.addEventListener(
      'click',
      closeMenu,
    );
  });
document.addEventListener(
  'keydown',
  (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  },
);
window.addEventListener('resize', () => {
  if (window.innerWidth > 720) {
    closeMenu();
  }
});
// Настройка уменьшения движения в системе.
const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion:' + ' reduce)',
);
let chartFrame = null;
let chartIntro = null;
// Отрисовка линии, заливки и точек графика.
function renderChart(points) {
  const segments = points.map(
    (point, index) => {
      const [x, y] = point;
      const command = index ? 'L' : 'M';
      return (
        '' +
        command +
        '' +
        x +
        ' ' +
        y +
        ''
      );
    },
  );
  const path = segments.join('');
  const line = document.querySelector(
    '#chart-line',
  );
  const area = document.querySelector(
    '#chart-area',
  );
  const pointGroup = document.querySelector(
    '#chart-points',
  );
  while (pointGroup.children.length
      < points.length) {
    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg', 'circle',
    );
    circle.setAttribute('r', '4');
    pointGroup.append(circle);
  }
  while (pointGroup.children.length
      > points.length) {
    pointGroup.lastElementChild.remove();
  }
  const circles = pointGroup.children;
  line.setAttribute('d', path);
  area.setAttribute(
    'd',
    '' + path + 'V175H40Z',
  );
  Array.from(circles).forEach((circle, index) => {
    circle.setAttribute(
      'cx',
      points[index][0],
    );
    circle.setAttribute(
      'cy',
      points[index][1],
    );
  });
}
// Плавный переход от текущих точек к новым.
function transitionChart(points) {
  cancelAnimationFrame(chartFrame);
  chartIntro?.cancel();
  if (reducedMotion.matches) {
    renderChart(points);
    return;
  }
  const circles =
    document.querySelectorAll(
      '#chart-points circle',
    );
  const from = Array.from(
    circles,
    (circle) => {
      const x = Number(
        circle.getAttribute('cx'),
      );
      const y = Number(
        circle.getAttribute('cy'),
      );
      return [x, y];
    },
  );
  const started = performance.now();
  function tick(now) {
    const elapsed = now - started;
    const progress = Math.min(
      1,
      elapsed / 650,
    );
    const ease =
      1 - Math.pow(1 - progress, 3);
    const nextPoints = points.map(
      (point, index) => {
        const [x, y] = point;
        const [oldX, oldY] = from[index]
          || from.at(-1) || point;
        const nextX =
          oldX + (x - oldX) * ease;
        const nextY =
          oldY + (y - oldY) * ease;
        return [nextX, nextY];
      },
    );
    renderChart(nextPoints);
    if (progress < 1) {
      chartFrame =
        requestAnimationFrame(tick);
    } else {
      chartFrame = null;
    }
  }
  chartFrame =
    requestAnimationFrame(tick);
}
// Анимация первого появления графика.
function animateChartIntro() {
  const line = document.querySelector(
    '#chart-line',
  );
  const length = line.getTotalLength();
  const dash =
    '' + length + ' ' + length + '';
  const frames = [
    {
      strokeDasharray: dash,
      strokeDashoffset: length,
    },
    {
      strokeDasharray: dash,
      strokeDashoffset: 0,
    },
  ];
  const options = {
    duration: 1300,
    easing:
      'cubic-bezier(.22,1,.36,1' + ')',
  };
  chartIntro = line.animate(
    frames,
    options,
  );
}
// Без поддержки API содержимое остаётся видимым.
const canObserve =
  'IntersectionObserver' in window;
if (
  canObserve &&
  !reducedMotion.matches
) {
  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const element = entry.target;
          element.classList.add(
            'is-visible',
          );
          observer.unobserve(element);
        });
      },
      { threshold: 0.12 },
    );
  const revealSelector = [
    '.section > div',
    '.value > .eyebrow',
    '.steps article',
    '.roadmap-grid article',
    '.materials > div',
  ].join(', ');
  const elements =
    document.querySelectorAll(
      revealSelector,
    );
  elements.forEach((element, index) => {
    // CSS сохраняет видимость при фокусе.
    const delay =
      '' + (index % 3) * 65 + 'ms';
    element.classList.add('reveal');
    element.style.setProperty(
      '--reveal-delay',
      delay,
    );
    observer.observe(element);
  });
  const chartObserver =
    new IntersectionObserver(
      (entries) => {
        const visible = entries.some(
          (entry) => {
            return entry.isIntersecting;
          },
        );
        if (!visible) {
          return;
        }
        const canAnimate =
          !reducedMotion.matches;
        if (
          canAnimate &&
          chartFrame === null
        ) {
          animateChartIntro();
        }
        chartObserver.disconnect();
      },
      { threshold: 0.4 },
    );
  const chart =
    document.querySelector('.chart');
  chartObserver.observe(chart);
  reducedMotion.addEventListener(
    'change',
    (event) => {
      if (!event.matches) {
        return;
      }
      const revealed =
        document.querySelectorAll(
          '.reveal',
        );
      revealed.forEach((element) => {
        element.classList.add(
          'is-visible',
        );
      });
      observer.disconnect();
      chartObserver.disconnect();
      chartIntro?.cancel();
    },
  );
}
// Три вымышленных сценария отдельного приложения.
// Состояние существует только в памяти страницы.
const examples = {
  stable: {
    tag: '024', group: 'А',
    weights: [42, 48.8, 55.8, 62.6, 68.4],
    nextWeight: 69.8,
    status: 'Положительная динамика',
    insight: 'В этом примере масса растёт. '
      + 'История помогает увидеть динамику '
      + 'каждого условного телёнка.',
  },
  attention: {
    tag: '017', group: 'А',
    weights: [43, 49.6, 55.2, 55.4, 52.8],
    nextWeight: 53,
    status: 'Изменение в примере',
    insight: 'В условных данных есть снижение '
      + 'веса. Так приложение могло бы выделить '
      + 'запись для проверки специалистом.',
  },
  balanced: {
    tag: '031', group: 'Б',
    weights: [45, 50, 55, 59.5, 62.4],
    nextWeight: 63.8,
    status: 'Плавный рост',
    insight: 'Ещё один условный телёнок '
      + 'из другой группы. При выборе меняются '
      + 'карточка, история и график.',
  },
};
const simulated = new Set();
let selectedExample = 'stable';
const demoNumber = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
});
function demoWeights(key) {
  const example = examples[key];
  return simulated.has(key)
    ? [...example.weights, example.nextWeight]
    : [...example.weights];
}
function updateTabs(button) {
  document.querySelectorAll('[data-animal]')
    .forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed',
        String(active));
    });
}
function updateWeight(weights) {
  const weight = document.querySelector('#weight');
  const unit = document.createElement('small');
  unit.textContent = 'кг';
  weight.replaceChildren(
    document.createTextNode(
      demoNumber.format(weights.at(-1)) + ' ',
    ), unit,
  );
}
function updateHistory(weights) {
  const body = document.querySelector(
    '#demo-history-body',
  );
  body.replaceChildren();
  weights.forEach((weight, index) => {
    const row = document.createElement('tr');
    const period = document.createElement('td');
    const mass = document.createElement('td');
    period.textContent = (index + 1) + '-я неделя';
    mass.textContent = demoNumber.format(weight);
    row.append(period, mass);
    body.append(row);
  });
}
function updateWeekLabels(count) {
  const existing = Array.from(
    document.querySelectorAll('[data-week-label]'),
  );
  const group = existing[0].parentElement;
  existing.forEach(label => label.remove());
  for (let index = 0; index < count; index++) {
    const label = document.createElementNS(
      'http://www.w3.org/2000/svg', 'text',
    );
    label.setAttribute('data-week-label', '');
    label.setAttribute('x', String(
      40 + index * 412 / (count - 1) - 6,
    ));
    label.setAttribute('y', '201');
    label.textContent = String(index + 1)
      .padStart(2, '0');
    group.append(label);
  }
}
function animateInsight() {
  if (reducedMotion.matches) return;
  const insight = document.querySelector('.insight');
  insight.getAnimations().forEach(a => a.cancel());
  insight.animate([
    { opacity: .5, transform: 'translateY(5px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration: 350, easing: 'ease-out' });
}
function selectExample(button, message) {
  selectedExample = button.dataset.animal;
  const example = examples[selectedExample];
  const weights = demoWeights(selectedExample);
  const points = weights.map((weight, index) => [
    40 + index * 412 / (weights.length - 1),
    175 - (weight - 40) * 5,
  ]);
  updateTabs(button);
  transitionChart(points);
  updateWeekLabels(weights.length);
  updateWeight(weights);
  updateHistory(weights);
  const status = document.querySelector('#status');
  status.textContent = example.status;
  status.classList.toggle('warn',
    selectedExample === 'attention');
  document.querySelector('#demo-card-title')
    .textContent = 'Карточка № ' + example.tag
      + ' · группа ' + example.group;
  document.querySelector('#chart-desc').textContent =
    'Условный пример № ' + example.tag + ': '
      + weights.map(w => demoNumber.format(w))
        .join(', ') + ' кг; по одной точке '
      + 'на каждую неделю. Это вымышленные данные.';
  document.querySelector('#insight-text').textContent =
    example.insight;
  const hasNewPoint = simulated.has(selectedExample);
  const add = document.querySelector(
    '#demo-measurement',
  );
  add.disabled = hasNewPoint;
  add.textContent = hasNewPoint
    ? 'Условная точка добавлена'
    : 'Показать новое измерение';
  document.querySelector('#demo-announcement')
    .textContent = message || 'Выбран пример № '
      + example.tag + '. Последнее условное '
      + 'измерение: '
      + demoNumber.format(weights.at(-1)) + ' кг.';
  document.querySelectorAll('[data-roster-weight]')
    .forEach(label => {
      label.textContent = demoNumber.format(
        demoWeights(label.dataset.rosterWeight)
          .at(-1),
      ) + ' кг';
    });
  animateInsight();
}
const exampleButtons = document.querySelectorAll(
  '[data-animal]',
);
exampleButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectExample(button);
  });
});
document.querySelector('#demo-measurement')
  .addEventListener('click', () => {
    if (simulated.has(selectedExample)) return;
    simulated.add(selectedExample);
    const button = document.querySelector(
      '[data-animal="' + selectedExample + '"]',
    );
    selectExample(button,
      'В пример добавлена шестая условная точка. '
        + 'Никакие данные на сервер не отправлены.');
  });
document.querySelector('#demo-reset')
  .addEventListener('click', () => {
    simulated.clear();
    selectExample(exampleButtons[0],
      'Пример сброшен. Показаны исходные '
        + 'вымышленные данные трёх телят.');
  });
updateHistory(demoWeights(selectedExample));
