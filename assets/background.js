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

  var sky = document.body.getAttribute('data-theme') === 'sky';
  var colors = sky
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
    var shape = Math.random() > 0.3 ? (sky ? 'star' : 'heart') : 'dot';
    return {
      shape: shape,
      x: rand(0, width),
      y: initial ? rand(0, height) : height + rand(20, 120),
      size: shape === 'dot' ? rand(3, 7) : sky ? rand(8, 18) : rand(9, 22),
      speed: shape === 'dot' ? rand(3, 9) : rand(7, 17),
      sway: rand(0.25, 0.6),
      phase: rand(0, Math.PI * 2),
      rotation: rand(-0.35, 0.35),
      spin: sky ? rand(-0.04, 0.04) : rand(-0.12, 0.12),
      alpha: shape === 'dot' ? rand(0.2, 0.38) : sky ? rand(0.22, 0.42) : rand(0.18, 0.34),
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

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(10, Math.min(24, Math.round(width * height / 78000)));
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
