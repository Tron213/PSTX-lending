<?php
if (!defined('PASTUKH') || !admin()) exit;
?>
<label>
  Тип записи
  <select name="kind" id="post-kind">
    <option value="news">Новость</option>
    <option value="trial">
      Результат испытания
    </option>
    <option value="trial-plan">
      План испытания
    </option>
  </select>
</label>
<fieldset id="trial-fields" hidden>
  <legend>Дневник испытаний</legend>
  <p class="hint">
    Публикуйте фактические наблюдения.
    Если измерений ещё нет, выберите
    «План испытания». Незаполненную
    запись можно сохранить черновиком.
  </p>
  <label>
    Цель проверки
    <textarea name="trial_goal"
      rows="2" maxlength="2000"></textarea>
  </label>
  <label>
    Условия и методика
    <textarea name="trial_conditions"
      rows="3" maxlength="2000"></textarea>
  </label>
  <label>
    Показание системы / результат
    <textarea name="trial_reading"
      rows="2" maxlength="2000"></textarea>
  </label>
  <label>
    Контрольное измерение и расхождение
    <textarea name="trial_reference"
      rows="2" maxlength="2000"></textarea>
  </label>
  <label>
    Вывод и ограничения проверки
    <textarea name="trial_conclusion"
      rows="3" maxlength="2000"></textarea>
  </label>
  <label>
    Следующий шаг
    <textarea name="trial_next"
      rows="2" maxlength="2000"></textarea>
  </label>
</fieldset>
<p id="post-status" class="hint"></p>
<button type="button" id="save-draft"
  class="secondary">
  Сохранить черновик
</button>
