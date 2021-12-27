/** @type {HTMLParagraphElement | null} - 説明文の出力先 */
let target = null;
const onmouseleave = function () {
  if (target) {
    target.textContent = '';
  }
};

/**
 * 実際にイベントリスナを付与します
 * @param {HTMLElement} elm - 説明するUI
 * @param {string} description - 説明文
 */
const addEvent = (elm, description) => {
  const onmouseenter = () => {
    if (target) {
      target.textContent = description;
    }
  };

  elm.addEventListener('mouseenter', onmouseenter);
  elm.addEventListener('mouseleave', onmouseleave);
  elm.addEventListener('focus', onmouseenter);
  elm.addEventListener('blur', onmouseleave);
};

document.addEventListener('DOMContentLoaded', () => {
  target = /** @type {HTMLParagraphElement} */(document.getElementById('description'));
});

/**
 * マウスホバー・フォーカス時に説明文を表示します
 * @param {HTMLElement} elm - 説明するUI
 * @param {string} description - 説明文
 */
module.exports.addDescription = function (elm, description) {
  addEvent(elm, description);
};
