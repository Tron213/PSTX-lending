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
  const circles =
    document.querySelectorAll(
      '#chart-points circle',
    );
  line.setAttribute('d', path);
  area.setAttribute(
    'd',
    '' + path + 'V175H40Z',
  );
  circles.forEach((circle, index) => {
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
        const [oldX, oldY] = from[index];
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
// Условные данные, а не реальные измерения.
const examples = {
  stable: {
    weights: [42, 48.8, 55.8, 62.6, 68.4],
    status: 'Положительная динамика',
    description:
      'Вес растёт с 42 до 68,4 ' +
      'килограмма ' +
      'за 5 недель.',
    insight:
      'В этом примере вес увели' +
      'чивается ' +
      ('при каждом измерении. Ис' +
        'тория ') +
      ('позволяет увидеть устойч' +
        'ивый рост.'),
  },
  attention: {
    weights: [43, 49.6, 55.2, 55.4, 52.8],
    status: 'Обратить внимание',
    description:
      'Вес сначала растёт, зате' +
      'м почти ' +
      ('не меняется и снижается ' +
        'с 55,4 ') +
      'до 52,8 килограмма.',
    insight:
      'В этом примере после зам' +
      'едления роста ' +
      ('вес снижается. Такая дин' +
        'амика — повод ') +
      ('для осмотра специалистом' +
        '.'),
  },
};
// Подсветка выбранного примера.
function updateTabs(button) {
  const tabs = document.querySelectorAll(
    '[data-animal]',
  );
  tabs.forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle(
      'active',
      active,
    );
    tab.setAttribute(
      'aria-pressed',
      String(active),
    );
  });
}
// Последнее измерение и единица измерения.
function updateWeight(example) {
  const weight =
    document.querySelector('#weight');
  const lastWeight =
    example.weights.at(-1);
  const value =
    lastWeight.toLocaleString('ru-RU');
  const text = document.createTextNode(
    value + ' ',
  );
  const unit =
    document.createElement('small');
  unit.textContent = 'кг';
  weight.replaceChildren(text, unit);
}
// Пояснение появляется после переключения.
function animateInsight() {
  if (reducedMotion.matches) {
    return;
  }
  const insight =
    document.querySelector('.insight');
  insight
    .getAnimations()
    .forEach((animation) => {
      animation.cancel();
    });
  insight.animate(
    [
      {
        opacity: 0.5,
        transform: 'translateY(5px)',
      },
      {
        opacity: 1,
        transform: 'translateY(0)',
      },
    ],
    {
      duration: 350,
      easing: 'ease-out',
    },
  );
}
// Обновление карточки при выборе примера.
function selectExample(button) {
  const selected = button.dataset.animal;
  const example = examples[selected];
  const points = example.weights.map(
    (weight, index) => {
      const x = 40 + index * 103;
      const y = 175 - (weight - 40) * 5;
      return [x, y];
    },
  );
  const status =
    document.querySelector('#status');
  const description =
    document.querySelector('#chart-desc');
  const insightText =
    document.querySelector(
      '#insight-text',
    );
  updateTabs(button);
  transitionChart(points);
  updateWeight(example);
  status.textContent = example.status;
  status.classList.toggle(
    'warn',
    selected === 'attention',
  );
  description.textContent =
    example.description;
  insightText.textContent =
    example.insight;
  animateInsight();
}
const exampleButtons =
  document.querySelectorAll(
    '[data-animal]',
  );
exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectExample(button);
  });
});
