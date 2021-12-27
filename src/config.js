const {addDescription} = require('../utils/description');

module.exports = () => {
  const {body, title} = document;
  /** @type {HTMLButtonElement} */
  const editBtn = (document.getElementById('edit'));
  /** @type {HTMLButtonElement} */
  const muteBtn = (document.getElementById('mute'));
  /** @type {HTMLButtonElement} */
  const allStopBtn = (document.getElementById('stop'));
  /** すべての再生を終了 */
  const stop = () => {
    allStopBtn.disabled = true;
    document.querySelectorAll('audio').forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };
  /** もともとミュートだったか */
  let muteCache = false;

  addDescription(editBtn, 'エントリーの編集を行います。');
  addDescription(muteBtn, '音声を再生しないようにすることができます。状態はアプリケーションのタイトルでも確認できます。');
  addDescription(allStopBtn, '現在再生されているすべての音声を停止します。');

  editBtn.addEventListener('click', function () {
    const isEdit = body.dataset.edit !== 'true';
    /** @type {HTMLImageElement} */
    const img = (this.firstElementChild);
    /** @type {NodeListOf<HTMLInputElement>} */
    const keyInputs = (document.querySelectorAll('.js-key'));
    /** @type {NodeListOf<HTMLInputElement>} */
    const pathInputs = (document.querySelectorAll('.js-path'));

    body.dataset.edit = String(isEdit);
    img.src = isEdit ? './img/unlock.svg' : './img/lock.svg';
    img.alt = isEdit ? 'Edit Mode ON' : 'Edit Mode OFF';
    img.dataset.state = isEdit ? 'on' : 'off';

    if (isEdit) {
      body.dataset.transition = 'disable';
      muteCache = body.dataset.mute === 'true';

      if (!muteCache) {
        muteBtn.click();
      }

      muteBtn.disabled = true;

      for (const input of keyInputs) {
        input.dataset.edit = 'on';
      }

      for (const input of pathInputs) {
        input.readOnly = false;
      }

      return;
    }

    // ! transitionの有効化タイミング調整
    setTimeout(() => {
      body.dataset.transition = 'enable';
    }, 100);

    muteBtn.disabled = false;

    if (!muteCache) {
      muteBtn.click();
    }

    for (const input of keyInputs) {
      input.dataset.edit = 'off';
    }

    for (const input of pathInputs) {
      input.readOnly = true;
    }
  });

  muteBtn.addEventListener('click', function () {
    const isMute = body.dataset.mute !== 'true';
    /** @type {HTMLImageElement} */
    const img = (this.firstElementChild);

    body.dataset.mute = String(isMute);
    img.src = isMute ? './img/mute.svg' : './img/unmute.svg';
    img.alt = isMute ? 'Mute ON' : 'Mute OFF';
    document.title = `${title}${isMute ? ' (Muted)' : ''}`;

    stop();
  });

  allStopBtn.addEventListener('click', stop);
};
