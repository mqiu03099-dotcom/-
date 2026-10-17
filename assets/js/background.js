(function () {
  var motionless = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var aurora = document.createElement('div');
  aurora.className = 'bg-aurora';
  aurora.setAttribute('aria-hidden', 'true');
  var canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  document.body.prepend(aurora);

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var theme = document.body.getAttribute('data-theme') || '';
  var sky = theme === 'sky';
  var baseShape = document.body.getAttribute('data-shape') || (sky ? 'star' : 'heart');
  var shapePools = {
    sky: ['star', 'star', 'star', 'sparkle', 'dot', 'dot'],
    macaron: ['heart', 'heart', 'petal', 'bubble', 'sparkle', 'dot'],
    crush: ['heart', 'heart', 'petal', 'sparkle', 'dot'],
    match: ['heart', 'ring', 'sparkle', 'dot'],
    flirt: ['heart', 'petal', 'sparkle', 'dot'],
    ex: ['heart', 'petal', 'ring', 'dot'],
    ideal: ['star', 'heart', 'sparkle', 'dot'],
    brain: ['heart', 'diamond', 'sparkle', 'dot'],
    talk: ['bubble', 'heart', 'sparkle', 'dot'],
    attach: ['heart', 'ring', 'sparkle', 'dot'],
    give: ['coin', 'heart', 'star', 'sparkle', 'dot'],
    date: ['star', 'heart', 'petal', 'sparkle', 'dot'],
    fight: ['spark', 'heart', 'shard', 'dot'],
    depend: ['heart', 'bubble', 'ring', 'dot']
  };
  var pool = shapePools[theme] || [baseShape, baseShape, 'dot', 'sparkle'];
  var shapeStyle = {
    dot: [3, 8, 3, 9, 0.24, 0.44],
    heart: [10, 24, 7, 17, 0.22, 0.4],
    star: [9, 20, 7, 17, 0.26, 0.48],
    sparkle: [7, 16, 5, 13, 0.24, 0.45],
    petal: [8, 18, 5, 13, 0.24, 0.45],
    bubble: [9, 22, 4, 11, 0.2, 0.36],
    ring: [9, 20, 5, 13, 0.22, 0.4],
    diamond: [8, 16, 6, 15, 0.24, 0.42],
    coin: [9, 18, 6, 14, 0.26, 0.46],
    spark: [9, 17, 7, 16, 0.24, 0.42],
    shard: [8, 16, 6, 14, 0.22, 0.4]
  };
  var customColors = getComputedStyle(document.body).getPropertyValue('--particles').trim();
  var colors = customColors
    ? customColors.split(',').map(function (color) { return color.trim(); }).filter(Boolean)
    : sky
      ? ['#5f9ed6', '#7db7e8', '#a4cff0', '#c6e2f8']
      : ['#f4a3bd', '#c2aff0', '#8fc9f7', '#9adfc6', '#f2d38b'];
  var items = [];
  var width = 0;
  var height = 0;
  var dpr = 1;
  var raf = 0;
  var last = 0;
  var clock = 0;
  var pointerX = 0;
  var pointerY = 0;
  var targetX = 0;
  var targetY = 0;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeItem(initial) {
    var shape = pool[Math.floor(Math.random() * pool.length)];
    var style = shapeStyle[shape] || shapeStyle.heart;
    return {
      shape: shape,
      x: rand(0, width),
      y: initial ? rand(0, height) : height + rand(20, 120),
      size: rand(style[0], style[1]),
      speed: rand(style[2], style[3]),
      sway: rand(0.25, 0.6),
      phase: rand(0, Math.PI * 2),
      rotation: rand(-0.35, 0.35),
      spin: shape === 'star' || shape === 'sparkle' ? rand(-0.04, 0.04) : shape === 'ring' || shape === 'bubble' ? 0 : rand(-0.12, 0.12),
      alpha: rand(style[4], style[5]),
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }

  function drawStar(x, y, size, rotation) {
    var outer = size / 2;
    var inner = outer * 0.44;
    ctx.beginPath();
    for (var i = 0; i < 10; i += 1) {
      var radius = i % 2 === 0 ? outer : inner;
      var angle = -Math.PI / 2 + i * Math.PI / 5;
      var px = Math.cos(angle) * radius;
      var py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawSparkle(size) {
    var r = size / 2;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.18, -r * 0.18, r, 0);
    ctx.quadraticCurveTo(r * 0.18, r * 0.18, 0, r);
    ctx.quadraticCurveTo(-r * 0.18, r * 0.18, -r, 0);
    ctx.quadraticCurveTo(-r * 0.18, -r * 0.18, 0, -r);
    ctx.fill();
  }

  function drawSpark(size) {
    var s = size / 16;
    ctx.beginPath();
    ctx.moveTo(1 * s, -8 * s);
    ctx.lineTo(-4 * s, 1 * s);
    ctx.lineTo(0, 1 * s);
    ctx.lineTo(-2 * s, 8 * s);
    ctx.lineTo(5 * s, -2 * s);
    ctx.lineTo(1 * s, -2 * s);
    ctx.closePath();
    ctx.fill();
  }

  function drawShard(size) {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.38, size * 0.36);
    ctx.lineTo(-size * 0.32, size * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(26, Math.min(60, Math.round(width * height / 24000)));
    items = [];
    for (var i = 0; i < count; i += 1) items.push(makeItem(true));
    if (motionless) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    pointerX += (targetX - pointerX) * 0.05;
    pointerY += (targetY - pointerY) * 0.05;
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var depth = item.size / 22;
      var x = item.x + pointerX * depth;
      var y = item.y + pointerY * depth;
      ctx.save();
      ctx.globalAlpha = item.alpha;
      ctx.fillStyle = item.color;
      if (item.shape === 'heart') {
        ctx.translate(x, y);
        ctx.rotate(item.rotation);
        ctx.scale(item.size / 18, item.size / 18);
        ctx.beginPath();
        ctx.moveTo(0, 7);
        ctx.bezierCurveTo(-12, -2, -9, -14, 0, -8);
        ctx.bezierCurveTo(9, -14, 12, -2, 0, 7);
        ctx.fill();
      } else if (item.shape === 'star') {
        ctx.translate(x, y);
        ctx.rotate(item.rotation);
        drawStar(0, 0, item.size, 0);
      } else if (item.shape === 'sparkle') {
        ctx.translate(x, y);
        ctx.rotate(item.rotation);
        drawSparkle(item.size);
      } else if (item.shape === 'petal') {
        ctx.translate(x, y);
        ctx.rotate(item.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, item.size * 0.5, item.size * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.shape === 'bubble') {
        ctx.translate(x, y);
        ctx.lineWidth = Math.max(1, item.size * 0.08);
        ctx.strokeStyle = item.color;
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = item.alpha * 0.6;
        ctx.beginPath();
        ctx.arc(-item.size * 0.16, -item.size * 0.16, item.size * 0.09, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.shape === 'ring') {
        ctx.translate(x, y);
        ctx.lineWidth = Math.max(1, item.size * 0.09);
        ctx.strokeStyle = item.color;
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (item.shape === 'diamond') {
        ctx.translate(x, y);
        ctx.rotate(item.rotation);
        ctx.beginPath();
        ctx.moveTo(0, -item.size * 0.5);
        ctx.lineTo(item.size * 0.34, 0);
        ctx.lineTo(0, item.size * 0.5);
        ctx.lineTo(-item.size * 0.34, 0);
        ctx.closePath();
        ctx.fill();
      } else if (item.shape === 'coin') {
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = item.alpha * 0.55;
        ctx.lineWidth = Math.max(1, item.size * 0.07);
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, item.size * 0.28, 0, Math.PI * 2);
        ctx.stroke();
      } else if (item.shape === 'spark') {
        ctx.translate(x, y);
        ctx.rotate(item.rotation);
        drawSpark(item.size);
      } else if (item.shape === 'shard') {
        ctx.translate(x, y);
        ctx.rotate(item.rotation);
        drawShard(item.size);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, item.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function frame(now) {
    raf = 0;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    clock += dt;
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      item.y -= item.speed * dt;
      item.x += Math.sin(clock * item.sway + item.phase) * 7 * dt;
      item.rotation += item.spin * dt;
      if (item.y < -30) {
        item.y = height + rand(20, 120);
        item.x = rand(0, width);
      }
      if (item.x < -40) item.x = width + 30;
      if (item.x > width + 40) item.x = -30;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (motionless || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  start();

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  window.addEventListener('pointermove', function (event) {
    targetX = (event.clientX / width - 0.5) * 14;
    targetY = (event.clientY / height - 0.5) * 10;
  }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });
})();
