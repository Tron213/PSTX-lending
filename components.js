// РЕДАКТИРУЙТЕ ЗАПОЛНИТЕЛИ В ЭТОМ ОБЪЕКТЕ.
// Состав и материалы пока приведены для примера.
const componentDetails = {
  rfid: {
    title: 'RFID-метка',
    summary:
      'Метка связывает телёнка с карточкой ' +
      'в системе. Ниже — пример её устройства.',
    layers: [
      'Защитный корпус',
      'Антенна и RFID-чип',
      'Элемент крепления'
    ],
    sections: [
      {
        title: 'Из чего сделана',
        text:
          'Пример: корпус из полимера, ' +
          'проводящая антенна и RFID-чип. ' +
          'Точные материалы нужно уточнить.'
      },
      {
        title: 'Как устроена',
        text:
          'Чип хранит идентификатор. Антенна ' +
          'обеспечивает связь со считывателем. ' +
          'Корпус защищает внутренние элементы.'
      },
      {
        title: 'Что уточнить',
        text:
          'Тип метки, частоту, дальность ' +
          'считывания, способ крепления ' +
          'и требования к безопасности.'
      }
    ]
  },
  scale: {
    title: 'Весовая платформа',
    summary:
      'Весы фиксируют массу телёнка. ' +
      'Ниже — пример состава стенда.',
    layers: [
      'Настил платформы',
      'Датчики нагрузки',
      'Опорная рама'
    ],
    sections: [
      {
        title: 'Из чего сделана',
        text:
          'Пример: металлическая рама, ' +
          'настил с нескользящей поверхностью ' +
          'и тензометрические датчики.'
      },
      {
        title: 'Как устроена',
        text:
          'Платформа передаёт нагрузку ' +
          'на датчики. Измерительный модуль ' +
          'обрабатывает сигнал, а система ' +
          'связывает вес с меткой животного.'
      },
      {
        title: 'Что уточнить',
        text:
          'Габариты, предел взвешивания, ' +
          'точность, защиту от влаги, ' +
          'способ очистки и подключения.'
      }
    ]
  }
};

// Ниже — поведение интерактивных элементов.
const partDialog = document.querySelector(
  '#component-dialog'
);
const partScene = document.querySelector(
  '.hero-art'
);
const partButtons = document.querySelectorAll(
  '.component-trigger'
);
const partShapes = document.querySelectorAll(
  '.calf-scene [data-part]'
);
let partOpener = null;

function highlightPart(part) {
  partScene.dataset.activePart = part;
}

function clearPartHighlight() {
  delete partScene.dataset.activePart;
}

function renderPartLayers(details) {
  const container = document.querySelector(
    '#component-layers'
  );

  container.replaceChildren();

  details.layers.forEach((label, index) => {
    const layer = document.createElement('div');
    const number = document.createElement('span');
    const text = document.createElement('span');

    layer.className = 'assembly-layer';
    number.textContent = String(index + 1);
    text.textContent = label;
    layer.append(number, text);
    container.append(layer);
  });
}

function renderPartSections(details) {
  const container = document.querySelector(
    '#component-sections'
  );

  container.replaceChildren();

  details.sections.forEach(section => {
    const block = document.createElement(
      'section'
    );
    const title = document.createElement('h3');
    const text = document.createElement('p');

    title.textContent = section.title;
    text.textContent = section.text;
    block.append(title, text);
    container.append(block);
  });
}

function openPart(part, opener) {
  const details = componentDetails[part];
  const title = document.querySelector(
    '#component-title'
  );
  const summary = document.querySelector(
    '#component-summary'
  );

  partOpener = opener;
  title.textContent = details.title;
  summary.textContent = details.summary;
  partDialog.dataset.part = part;
  renderPartLayers(details);
  renderPartSections(details);
  clearPartHighlight();
  document.body.classList.add('detail-open');
  partDialog.showModal();
}

partButtons.forEach(button => {
  const part = button.dataset.part;

  button.addEventListener('pointerenter', () => {
    highlightPart(part);
  });
  button.addEventListener('focus', () => {
    highlightPart(part);
  });
  button.addEventListener(
    'pointerleave',
    clearPartHighlight
  );
  button.addEventListener(
    'blur',
    clearPartHighlight
  );
  button.addEventListener('click', () => {
    openPart(part, button);
  });
});

partShapes.forEach(shape => {
  const part = shape.dataset.part;
  const selector = '.component-trigger' +
    `[data-part="${part}"]`;
  const button = document.querySelector(selector);

  shape.addEventListener('pointerenter', () => {
    highlightPart(part);
  });
  shape.addEventListener(
    'pointerleave',
    clearPartHighlight
  );
  shape.addEventListener('click', () => {
    openPart(part, button);
  });
});

const partClose = document.querySelector(
  '.component-close'
);

partClose.addEventListener('click', () => {
  partDialog.close();
});

// Щелчок по затемнённому фону закрывает окно.
partDialog.addEventListener('click', event => {
  if (event.target !== partDialog) {
    return;
  }

  const box = partDialog.getBoundingClientRect();
  const outside = (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );

  if (outside) {
    partDialog.close();
  }
});

// Escape обрабатывается самим элементом dialog.
partDialog.addEventListener('close', () => {
  document.body.classList.remove('detail-open');
  partOpener?.focus({ preventScroll: true });
});
