(() => {
  const scene = document.querySelector('.instrument-scene');
  const dialog = document.querySelector('#component-dialog');
  if (!scene || !dialog) return;
  const components = {
    rfid: {
      title: 'RFID-бирка',
      summary: 'Идентификатор связывает животное с его историей. Ниже описан общий принцип целевой системы.',
      sections: [
        ['Состав', 'RFID-метка включает микрочип и антенну в защитном корпусе. Метка несёт идентификатор; история измерений хранится отдельно от неё.'],
        ['Обмен данными', 'Считыватель получает идентификатор и передаёт его программной части. При взвешивании система должна сопоставить номер метки и результат измерения.'],
        ['Что нужно подтвердить', 'Тип и частоту метки, рабочую дальность, надёжность считывания и способ крепления команда уточнит после выбора и проверки компонентов.'],
      ],
    },
    scale: {
      title: 'Весовая платформа',
      summary: 'Платформа и измерительный модуль предназначены для получения массы животного. Это описание принципа, а не подтверждённых характеристик стенда.',
      sections: [
        ['Состав', 'Опорная конструкция и настил передают нагрузку на датчики. Измерительный модуль обрабатывает их электрический сигнал.'],
        ['Получение результата', 'После калибровки сигнал преобразуется в значение массы. В целевом сценарии запись содержит вес, время измерения и идентификатор животного.'],
        ['Что нужно подтвердить', 'Предел взвешивания, точность, повторяемость, габариты, защиту от влаги и условия очистки необходимо определить и проверить на реальном стенде.'],
      ],
    },
  };
  let timer, opener;
  const hide = () => {
    scene.querySelectorAll('.tech-tip').forEach(t => { t.hidden = true; });
    scene.querySelectorAll('.part-active').forEach(p => p.classList.remove('part-active'));
  };
  function show(key) {
    clearTimeout(timer);
    if (dialog.open) return;
    hide();
    document.getElementById(key + '-tip').hidden = false;
    scene.querySelectorAll('.calf-scene [data-part="' + key + '"]')
      .forEach(part => part.classList.add('part-active'));
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(hide, 180); };
  function open(key, trigger) {
    clearTimeout(timer); hide();
    opener = trigger;
    const content = components[key];
    document.querySelector('#component-title').textContent = content.title;
    const body = document.querySelector('#component-content');
    body.replaceChildren();
    const intro = document.createElement('p');
    intro.textContent = content.summary;
    body.append(intro);
    for (const [heading, text] of content.sections) {
      const title = document.createElement('h3'); title.textContent = heading;
      const p = document.createElement('p'); p.textContent = text;
      body.append(title, p);
    }
    const note = document.createElement('p');
    note.className = 'callout';
    note.textContent = 'Иллюстрация показывает концепцию. Точные модели и измерительные характеристики пока не заявлены.';
    body.append(note);
    dialog.showModal();
  }
  scene.querySelectorAll('[data-part]').forEach(trigger => {
    const key = trigger.dataset.part;
    trigger.addEventListener('pointerenter', () => show(key));
    trigger.addEventListener('pointerleave', later);
    trigger.addEventListener('focus', () => show(key));
    trigger.addEventListener('blur', later);
    trigger.addEventListener('click', () => open(key, trigger));
    if (trigger.tagName === 'BUTTON') {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-controls', 'component-dialog');
    }
  });
  scene.querySelectorAll('.tech-tip').forEach(tip => {
    tip.style.pointerEvents = 'auto';
    tip.addEventListener('pointerenter', () => clearTimeout(timer));
    tip.addEventListener('pointerleave', later);
  });
  document.querySelector('.component-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    hide(); opener?.focus?.({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right
        || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { clearTimeout(timer); hide(); }
  });
})();
