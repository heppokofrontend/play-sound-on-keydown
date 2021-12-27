module.exports = () => {
  const {body} = document;

  window.api.on('keypress', (_, e) => {
    if (
      body.dataset.edit === 'true' ||
      body.dataset.mute === 'true'
    ) {
      return;
    }

    // console.log(e);

    const selector = [
      `[data-keycode="${e.rawcode}"]`,
      e.ctrlKey ? '[data-meta~="Ctrl"]' : ':not([data-meta~="Ctrl"])',
      e.shiftKey ? '[data-meta~="Shift"]' : ':not([data-meta~="Shift"])',
      e.altKey ? '[data-meta~="Alt"]' : ':not([data-meta~="Alt"])',
    ].join('');

    // console.log(selector);

    for (const wrap of document.querySelectorAll(selector)) {
      const audio = wrap.querySelector('audio');

      if (audio) {
        if (audio.getAttribute('src')) {
          audio.currentTime = 0;
          audio.play();
        }

        wrap.classList.add('--run');
        setTimeout(() => wrap.classList.remove('--run'), 100);
      }
    }
  });
};
