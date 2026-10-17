(function () {
  var cfg = window.QUIZZES && window.QUIZZES[document.body.getAttribute('data-quiz')];
  if (!cfg) return;

  function $(id) { return document.getElementById(id); }

  function scrollTop() {
    window.scrollTo({ top: 0 });
  }

  var gateScreen = $('gate');
  var quizScreen = $('quiz');
  var resultScreen = $('result');
  var gateForm = $('gateForm');
  var passwordInput = $('password');
  var gateHint = $('gateHint');
  var progressLabel = $('progress');
  var barFill = $('barFill');
  var questionTitle = $('question');
  var optionButtons = Array.prototype.slice.call(document.querySelectorAll('[data-option]'));
  var optionsBox = optionButtons[0] && optionButtons[0].parentNode;
  var prevBtn = $('prev');
  var visual = $('visual');
  var scoreLabel = $('score');
  var resultTitle = $('resultTitle');
  var resultText = $('resultText');
  var resultExtra = $('resultExtra');
  var copyBtn = $('copy');
  var restartBtn = $('restart');

  var QUESTIONS = cfg.questions;
  var LABELS = ['完全符合', '比较符合', '不太符合', '完全不符合'];
  var ORDERS = QUESTIONS.map(function (_, questionIndex) {
    return [0, 1, 2, 3].map(function (optionIndex) {
      return (optionIndex + questionIndex) % 4;
    });
  });
  var index = 0;
  var answers = new Array(QUESTIONS.length).fill(0);
  var locked = false;
  var chart = null;
  var latest = '';

  function accent() {
    return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#efa9bf';
  }

  function show(screen) {
    [gateScreen, quizScreen, resultScreen].forEach(function (item) {
      item.hidden = item !== screen;
    });
    scrollTop();
  }

  function renderQuestion() {
    var question = QUESTIONS[index];
    progressLabel.textContent = '第 ' + (index + 1) + ' / ' + QUESTIONS.length + ' 题';
    barFill.style.width = ((index + 1) / QUESTIONS.length * 100) + '%';
    questionTitle.textContent = question.t;
    var order = ORDERS[index];
    optionButtons.forEach(function (button, optionIndex) {
      var labelIndex = order[optionIndex];
      var score = 4 - labelIndex;
      button.textContent = LABELS[labelIndex];
      button.classList.remove('is-picked');
      button.setAttribute('aria-pressed', String(answers[index] === score));
      if (answers[index] === score) button.classList.add('is-picked');
    });
    prevBtn.disabled = index === 0;
    if (optionsBox) optionsBox.classList.add('is-resetting');
    scrollTop();
  }

  function percentOf(sum, count) {
    if (!count) return 0;
    return Math.max(0, Math.min(100, Math.round((sum - count) / (count * 3) * 100)));
  }

  function compute() {
    var sums = cfg.dimensions ? cfg.dimensions.map(function () { return 0; }) : [];
    var counts = cfg.dimensions ? cfg.dimensions.map(function () { return 0; }) : [];
    var total = 0;
    QUESTIONS.forEach(function (question, i) {
      var score = answers[i] || 0;
      total += score;
      if (cfg.dimensions && typeof question.d === 'number') {
        sums[question.d] += score;
        counts[question.d] += 1;
      }
    });
    return { total: total, sums: sums, counts: counts };
  }

  function pickBand(list, value) {
    var found = list[0];
    list.forEach(function (item) {
      if (value >= item.min) found = item;
    });
    return found;
  }

  function drawRadar(values) {
    var color = accent();
    var radarBox = document.createElement('div');
    radarBox.id = 'radar';
    radarBox.className = 'mx-auto h-[280px] w-full sm:h-[330px]';
    radarBox.setAttribute('role', 'img');
    radarBox.setAttribute('aria-label', '六维雷达图');
    visual.appendChild(radarBox);
    if (!window.echarts) return;
    chart = echarts.init(radarBox, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      radar: {
        center: ['50%', '52%'],
        radius: '64%',
        shape: 'polygon',
        indicator: cfg.dimensions.map(function (item) { return { name: item.name, max: 100 }; }),
        axisName: { color: '#5b5470', fontSize: 12, fontWeight: 500 },
        axisLine: { lineStyle: { color: 'rgba(120,120,150,0.28)' } },
        splitLine: { lineStyle: { color: 'rgba(120,120,150,0.22)' } },
        splitArea: { areaStyle: { color: ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.12)'] } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          areaStyle: { color: color + '33' },
          lineStyle: { color: color, width: 2 },
          itemStyle: { color: color }
        }]
      }]
    });
    requestAnimationFrame(function () { chart.resize(); });
  }

  function renderResult() {
    var data = compute();
    var totalPercent = percentOf(data.total, QUESTIONS.length);
    var values = data.sums.map(function (sum, i) {
      return percentOf(sum, data.counts[i]);
    });
    var title = '';
    var text = '';
    var score = '';
    var extra = '';

    if (chart) {
      chart.dispose();
      chart = null;
    }
    visual.innerHTML = '';
    resultExtra.textContent = '';
    drawRadar(values);

    if (cfg.mode === 'stage') {
      var stage = pickBand(cfg.stages, totalPercent);
      title = stage.title;
      text = stage.text;
      score = '暧昧进度 ' + totalPercent + '%';
      extra = stage.advice;
    } else if (cfg.mode === 'type') {
      var top = 0;
      values.forEach(function (value, i) {
        if (value > values[top]) top = i;
      });
      var type = cfg.types[top];
      title = type.title;
      text = type.text;
      score = '主导类型 · ' + type.name;
      extra = type.advice;
    } else if (cfg.mode === 'tags') {
      var order = cfg.dimensions.map(function (item, i) {
        return { name: item.name, value: values[i], text: item.text };
      }).sort(function (a, b) { return b.value - a.value; });
      title = (cfg.resultTitle || '你的关键词') + '：' + order[0].name + ' × ' + order[1].name;
      text = order[0].text + order[1].text;
      score = '匹配度最高的两个方向';
      extra = cfg.note || '';
    } else if (cfg.mode === 'balance') {
      var you = Math.round((values[0] + values[2] + values[4]) / 3);
      var ta = Math.round((values[1] + values[3] + values[5]) / 3);
      var outcome = Math.abs(you - ta) <= 8 ? cfg.balance.even : (you > ta ? cfg.balance.you : cfg.balance.ta);
      title = outcome.title;
      text = outcome.text;
      score = '你 ' + you + '% · TA ' + ta + '%';
      extra = cfg.note || '';
    } else {
      var band = pickBand(cfg.bands, totalPercent);
      title = band.title;
      text = band.text;
      score = (cfg.unit || '综合指数') + ' ' + totalPercent + ' / 100';
      extra = band.advice;
    }

    resultTitle.textContent = title;
    resultText.textContent = text;
    scoreLabel.textContent = score;
    resultExtra.textContent = extra;
    latest = [title, score, text, extra].filter(Boolean).join('\n');
    show(resultScreen);
  }

  function startQuiz() {
    index = 0;
    answers = new Array(QUESTIONS.length).fill(0);
    locked = false;
    show(quizScreen);
    renderQuestion();
  }

  function clearReset() {
    if (optionsBox) optionsBox.classList.remove('is-resetting');
  }

  function copyResult() {
    var copyText = latest + '\n\n—— 本测试仅供娱乐与自我参考，不构成专业心理或情感建议。';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).catch(function () {});
    } else {
      var area = document.createElement('textarea');
      area.value = copyText;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    copyBtn.textContent = '已复制';
    setTimeout(function () { copyBtn.textContent = '复制结果'; }, 1500);
  }

  gateForm.addEventListener('submit', function (event) {
    event.preventDefault();
    // shortcut: client-side check only, readable in source; move to a server if this ever guards private data.
    if (passwordInput.value.trim() === cfg.password) {
      startQuiz();
      return;
    }
    gateHint.textContent = '暗号不对，再试一次';
    gateHint.style.color = '#d0567c';
    passwordInput.select();
  });

  passwordInput.addEventListener('input', function () {
    gateHint.textContent = '需要输入暗号才能进入开始测试';
    gateHint.style.color = '';
  });

  optionButtons.forEach(function (button, optionIndex) {
    button.addEventListener('click', function () {
      if (locked) return;
      locked = true;
      answers[index] = 4 - ORDERS[index][optionIndex];
      button.classList.add('is-tapped');
      setTimeout(function () { button.classList.remove('is-tapped'); }, 200);
      button.classList.add('is-picked');
      button.setAttribute('aria-pressed', 'true');
      setTimeout(function () {
        locked = false;
        if (index === QUESTIONS.length - 1) {
          renderResult();
          return;
        }
        index += 1;
        renderQuestion();
      }, 260);
    });
  });

  prevBtn.addEventListener('click', function () {
    if (locked || index === 0) return;
    index -= 1;
    renderQuestion();
  });

  restartBtn.addEventListener('click', startQuiz);
  copyBtn.addEventListener('click', copyResult);
  document.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'touch') clearReset();
  }, { passive: true });
  document.addEventListener('pointerdown', function (event) {
    if (event.pointerType !== 'touch') clearReset();
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (chart) chart.resize();
  });
})();
