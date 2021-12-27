const {addDescription} = require('../utils/description');
const {contextBridge, ipcRenderer} = require('electron');
const fs = require('fs').promises;
const path = require('path');
const csvPath = path.join(__dirname.replace(`app.asar${path.sep}app`, ''), 'config.csv');
const changeEvent = new Event('change');
/** @type {HTMLButtonElement | null} */
let allStopBtn = null;
/** @type {Promise[]} */
const playPromises = [];
const save = async () => {
  /** @type {HTMLElement[]} - div.wrap[] */
  const wraps = ([...document.querySelectorAll('.data')]);
  const data = wraps.map((wrap) => {
    /** @type {HTMLInputElement} - for file path */
    const filepath = (wrap?.querySelector('.js-path'));
    /** @type {HTMLInputElement} - for audio volume */
    const volume = (wrap?.querySelector('.js-volume'));

    filepath.value = filepath.value.replace(/"/g, '');

    return [
      wrap.dataset.keycode || '',
      wrap.dataset.key?.replace(' ', 'SpaceBar') || '',
      wrap.dataset.meta || '',
      filepath.value?.trim() || '',
      volume.value || '100',
    ].join(',');
  }).join('\n');

  await fs.writeFile(csvPath, data, {
    encoding: 'utf-8',
  });
};
/**
 * パスからファイル名を抽出する
 * @param {string} fp - ファイルパス
 * @return {string} ファイル名
 */
const getFileName = (fp) => {
  const {name, ext} = path.parse(fp);

  return `${name}${ext}`;
};
/** @param {Element | null} [_wrap] - div.data */
const addEvent = (_wrap) => {
  if (!_wrap) {
    return;
  }

  /** @type {HTMLElement} - A wrapper of UI */
  const wrap = (_wrap);
  /** @type {HTMLInputElement} - for key name */
  const key = (wrap.querySelector('.js-key'));
  /** @type {HTMLInputElement} - for file name */
  const filename = (wrap.querySelector('.js-filename'));
  /** @type {HTMLInputElement} - for file path */
  const filepath = (wrap.querySelector('.js-path'));
  /** @type {HTMLAudioElement} */
  const audio = (wrap.querySelector('.js-audio'));
  /** @type {HTMLInputElement} - for audio volume */
  const volume = (wrap.querySelector('.js-volume'));
  /** @type {HTMLButtonElement} - prev button */
  const prevBtn = (wrap.querySelector('.js-prev'));
  /** @type {HTMLButtonElement} - next button */
  const nextBtn = (wrap.querySelector('.js-next'));
  /** @type {HTMLButtonElement} - delete button */
  const deleteBtn = (wrap.querySelector('.js-delete'));

  audio.volume = Number(volume.value) / 100;

  addDescription(key, 'この音声を再生するためのキー入力設定です。');
  addDescription(filename, '再生する音声ファイルの名前です。');
  addDescription(filepath, '再生する音声ファイルのパスです。');
  addDescription(volume, 'この音声のボリュームです。');
  addDescription(prevBtn, 'このエントリーを1つ前に移動します。');
  addDescription(nextBtn, 'このエントリーを1つ後に移動します。');
  addDescription(deleteBtn, 'このエントリーを削除します。');

  allStopBtn = allStopBtn || /** @type {HTMLButtonElement} */(document.getElementById('stop'));

  audio.addEventListener('error', () => {
    if (!audio.getAttribute('src')) {
      return;
    }

    wrap.dataset.error = 'true';
  });

  audio.addEventListener('play', () => {
    if (!allStopBtn) {
      return;
    }

    const promise = new Promise((r) => {
      audio.addEventListener('pause', () => {
        r('pause');
      });

      audio.addEventListener('ended', () => {
        r('ended');
      });
    });

    playPromises.push(promise);

    if (allStopBtn.disabled) {
      Promise.all(playPromises).then(() => {
        if (allStopBtn) {
          allStopBtn.disabled = true;
        }

        playPromises.length = 0;
      });
    }

    allStopBtn.disabled = false;
  });

  key.addEventListener('keydown', function (e) {
    if (
      this.dataset.edit === 'off' ||
      /^tab$/i.test(e.key) // タブキーへのバインドは対象外
    ) {
      return;
    }

    e.preventDefault();

    if (
      (e.ctrlKey && e.shiftKey && e.altKey) || // メタキーの組み合わせは2つまで
      /^Arrow/i.test(e.key) || // 矢印キーへのバインドは対象外
      /^(Alt|Control|Shift|NonConvert|Alphanumeric|Hankaku|Zenkaku|F\d+|ScrollLock|Cancel|Pause|Pause|Insert|Home|PageUp|Delete|End|PageDown|NumLock|Clear|ContextMenu|Convert|Process)$/i.test(e.key) // 一部特殊キーへのバインドは対象外
    ) {
      return;
    }

    const values = [
      e.ctrlKey && !/control/i.test(e.key) ? 'Ctrl' : '',
      e.shiftKey && !/shift/i.test(e.key) ? 'Shift' : '',
      e.altKey && !/alt/i.test(e.key) ? 'Alt' : '',
    ].filter((val) => !!val);

    this.value = [...values, e.key.replace(' ', 'SpaceBar')].join(' + ').trim();
    wrap.dataset.meta = values.join(' ').trim();
    wrap.dataset.key = e.key;
    wrap.dataset.keycode = String(e.keyCode); // ! ioHookはkeyCodeベース
    save();
  });

  filepath.addEventListener('drop', function (e) {
    const file = e.dataTransfer?.files[0];

    if (
      filepath.readOnly ||
      !file
    ) {
      return;
    }

    filepath.value = file.path;
    filepath.dispatchEvent(changeEvent);
  });

  filepath.addEventListener('change', function () {
    wrap.dataset.error = 'false';
    audio.src = this.value.replace(/"/g, '');
    save();
  });

  filepath.addEventListener('change', function () {
    filename.value = getFileName(this.value);
    audio.src = this.value.replace(/"/g, '');
    save();
  });

  volume.addEventListener('change', function () {
    audio.volume = Number(this.value) / 100;
    save();
  });

  prevBtn.addEventListener('click', function () {
    if (wrap.previousElementSibling) {
      wrap.after(wrap.previousElementSibling);
      save();
    }
  });

  nextBtn.addEventListener('click', function () {
    if (wrap.nextElementSibling) {
      wrap.before(wrap.nextElementSibling);
      save();
    }
  });

  deleteBtn.addEventListener('click', function () {
    if (window.confirm('削除していいですか？\nAre you sure you want to permanently delete this entry?')) {
      wrap.remove();
      save();
    }
  });
};

// window.api.*
contextBridge.exposeInMainWorld('api', {
  on: (channel, callback) => ipcRenderer.on(channel, (event, argv) => callback(event, argv)),
  save,
});

window.addEventListener('DOMContentLoaded', async () => {
  /** @type {HTMLDivElement} - Sound List Placeholder */
  const app = (document.getElementById('app'));
  /** @type {HTMLButtonElement} - Add button */
  const addBtn = (document.getElementById('add'));
  const render = (csv) => {
    const src = (csv || '').replace(/\r\n?/g, '\n').split('\n').map((line) => {
      const [keycode, key, meta, fp, volume] = line.split(',');
      const value = [
        ...(meta || '').split(' '),
        key,
      ].filter((c) => !!c).join(' + ');

      return `
        <div class="data" data-keycode="${keycode || ''}" data-key="${key || ''}" data-meta="${meta || ''}">
          <div class="data__inner">
            <div class="data__col --key">
              <input class="js-key" aria-labelledby="label-keypattern" placeholder="key name" value="${value || ''}" data-edit="off" readonly>
            </div>

            <div class="data__col --path">
              <input class="js-filename" aria-labelledby="label-filename" placeholder="-" value="${fp ? getFileName(fp) : ''}" readonly>
              <input class="js-path" aria-labelledby="label-filepath" placeholder="file path" value="${fp || ''}" readonly>
            </div>

            <div class="data__col --ui">
              <audio class="js-audio" src="${fp || ''}" tabindex="-1" controls></audio>
              <input type="range" class="js-volume" aria-labelledby="label-volume" min="0" max="100" value="${volume || '100'}">
              <div class="data__controller" role="group" aria-labelledby="label-controller">
                <button type="button" class="js-prev">
                  <img src="./img/up.svg" alt="Prev">
                </button>
                <button type="button" class="js-next">
                  <img src="./img/down.svg" alt="Next">
                </button>
                <button type="button" class="js-delete">
                  <img src="./img/wastebasket.svg" alt="delete">
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    app?.insertAdjacentHTML('beforeend', src);
    document.querySelectorAll('.data').forEach(addEvent);
  };

  addDescription(addBtn, 'エントリーを追加します。');

  addBtn.addEventListener('click', () => {
    const readOnly = document.body.dataset.edit === 'true' ? '' : ' readOnly';

    app?.insertAdjacentHTML('beforeend', `
      <div class="data" data-keycode="">
        <div class="data__inner">
          <div class="data__col --key">
            <input class="js-key" aria-labelledby="label-keypattern" placeholder="key name" value="" data-edit="${readOnly ? 'off' : 'on'}" readonly>
          </div>

          <div class="data__col --path">
            <input class="js-filename" aria-labelledby="label-filename" placeholder="-" value="" readonly>
            <input class="js-path" aria-labelledby="label-filepath" placeholder="file path" value="" ${readOnly}>
          </div>

          <div class="data__col --ui">
            <audio class="js-audio" src="" tabindex="-1" controls></audio>
            <input type="range" class="js-volume" aria-labelledby="label-volume" min="0" max="100" value="100">
            <div class="data__controller" role="group" aria-labelledby="label-controller">
              <button type="button" class="js-prev">
                <img src="./img/up.svg" alt="Prev">
              </button>
              <button type="button" class="js-next">
                <img src="./img/down.svg" alt="Next">
              </button>
              <button type="button" class="js-delete">
                <img src="./img/wastebasket.svg" alt="delete">
              </button>
            </div>
          </div>
        </div>
      </div>
    `);

    addEvent(app.lastElementChild);
  });

  try {
    const csv = await fs.readFile(csvPath, {
      encoding: 'utf-8',
    });

    render(csv);
  } catch {
    render(',');
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    console.log(`${dependency}-version`, process.versions[dependency]);
  }
});
