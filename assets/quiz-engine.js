(function () {
  var cfg = window.QUIZZES && window.QUIZZES[document.body.getAttribute('data-quiz')];
  if (!cfg) return;

  function $(id) { return document.getElementById(id); }

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
  }

  function renderQuestion() {
    var question = QUESTIONS[index];
    progressLabel.textContent = '第 ' + (index + 1) + ' / ' + QUESTIONS.length + ' 题';
    barFill.style.width = ((index + 1) / QUESTIONS.length * 100) + '%';
    questionTitle.textContent = question.t;
    optionButtons.forEach(function (button, optionIndex) {
      var score = 4 - optionIndex;
      button.textContent = LABELS[optionIndex];
      button.classList.remove('is-picked');
      button.setAttribute('aria-pressed', String(answers[index] === score));
      if (answers[index] === score) button.classList.add('is-picked');
    });
    prevBtn.disabled = index === 0;
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

  function bars(items) {
    return '<div class="mt-5 space-y-2 text-left">' + items.map(function (item) {
      return '<div><div class="flex items-center justify-between text-xs text-muted"><span>' + item.name + '</span><span>' + item.value + '%</span></div><div class="type-track"><i style="width:' + item.value + '%;background:' + item.color + '"></i></div></div>';
    }).join('') + '</div>';
  }

  function renderResult() {
    var data = compute();
    var totalPercent = percentOf(data.total, QUESTIONS.length);
    var color = accent();
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

    if (cfg.mode === 'radar') {
      var values = data.sums.map(function (sum, i) {
        return percentOf(sum, data.counts[i]);
      });
      var radarBox = document.createElement('div');
      radarBox.id = 'radar';
      radarBox.className = 'mx-auto h-[280px] w-full sm:h-[330px]';
      radarBox.setAttribute('role', 'img');
      radarBox.setAttribute('aria-label', '六维雷达图');
      visual.appendChild(radarBox);
      if (window.echarts) {
        chart = echarts.init(radarBox, null, { renderer: 'svg' });
        chart.setOption({
          animation: false,
          radar: {
            center: ['50%', '52%'],
            radius: '64%',
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
      var radarBand = pickBand(cfg.bands, totalPercent);
      title = radarBand.title;
      text = radarBand.text;
      score = (cfg.unit || '综合指数') + ' ' + totalPercent + ' / 100';
      extra = radarBand.advice;
    } else if (cfg.mode === 'meter') {
      visual.innerHTML = '<div class="score-ring" style="--value:' + totalPercent + ';--ring:' + color + '"><div class="score-ring-inner"><strong>' + totalPercent + '</strong><span>' + (cfg.unit || '心动指数') + '</span></div></div>';
      var meterBand = pickBand(cfg.bands, totalPercent);
      title = meterBand.title;
      text = meterBand.text;
      score = (cfg.unit || '指数') + ' ' + totalPercent + ' / 100';
      extra = meterBand.advice;
    } else if (cfg.mode === 'stage') {
      var stage = pickBand(cfg.stages, totalPercent);
      visual.innerHTML = '<ol class="stage-list">' + cfg.stages.map(function (item) {
        return '<li class="' + (item === stage ? 'is-active' : '') + '"><span>' + (cfg.stages.indexOf(item) + 1) + '</span><b>' + item.name + '</b></li>';
      }).join('') + '</ol>';
      title = stage.title;
      text = stage.text;
      score = '暧昧进度 ' + totalPercent + '%';
      extra = stage.advice;
    } else if (cfg.mode === 'type') {
      var typeValues = data.sums.map(function (sum, i) {
        return percentOf(sum, data.counts[i]);
      });
      var top = 0;
      typeValues.forEach(function (value, i) {
        if (value > typeValues[top]) top = i;
      });
      var type = cfg.types[top];
      visual.innerHTML = '<div class="type-badge">' + type.name + '</div>' + bars(cfg.dimensions.map(function (item, i) {
        return { name: item.name, value: typeValues[i], color: color };
      }));
      title = type.title;
      text = type.text;
      score = '主导类型 · ' + type.name;
      extra = type.advice;
    } else if (cfg.mode === 'tags') {
      var tagValues = data.sums.map(function (sum, i) {
        return percentOf(sum, data.counts[i]);
      });
      var order = cfg.dimensions.map(function (item, i) {
        return { name: item.name, value: tagValues[i], text: item.text };
      }).sort(function (a, b) { return b.value - a.value; });
      visual.innerHTML = '<div class="flex flex-wrap justify-center gap-2">' + order.slice(0, 3).map(function (item) {
        return '<span class="tag-chip">' + item.name + '</span>';
      }).join('') + '</div>';
      title = (cfg.resultTitle || '你的关键词') + '：' + order[0].name + ' × ' + order[1].name;
      text = order[0].text + order[1].text;
      score = '匹配度最高的两个方向';
      extra = cfg.note || '';
    } else if (cfg.mode === 'balance') {
      var you = percentOf(data.sums[0], data.counts[0]);
      var ta = percentOf(data.sums[1], data.counts[1]);
      visual.innerHTML = bars([
        { name: '你', value: you, color: color },
        { name: 'TA', value: ta, color: color }
      ]);
      var outcome = Math.abs(you - ta) <= 8 ? cfg.balance.even : (you > ta ? cfg.balance.you : cfg.balance.ta);
      title = outcome.title;
      text = outcome.text;
      score = '你 ' + you + '% · TA ' + ta + '%';
      extra = cfg.note || '';
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

  function copyResult() {
    var copyText = latest + '\n\n—— 趣味测试 · 由潇洒哥提供技术支持';
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
    if (passwordInput.value.trim() === (cfg.password || '7700')) {
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
      answers[index] = 4 - optionIndex;
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
      }, 180);
    });
  });

  prevBtn.addEventListener('click', function () {
    if (locked || index === 0) return;
    index -= 1;
    renderQuestion();
  });

  restartBtn.addEventListener('click', startQuiz);
  copyBtn.addEventListener('click', copyResult);
  window.addEventListener('resize', function () {
    if (chart) chart.resize();
  });
})();
