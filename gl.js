/* WebGL layer: the logo extruded in 3D and pinned to the hero .mark box, plus triangle shards drifting behind the page.
   Loaded as a classic script with a dynamic import so it also works when index.html is opened from disk. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js').then(start, function () {});

  // Same paths as the #logo symbol. z/depth are in SVG units; out is the direction a piece flies in from
  var PARTS = [
    { d: 'M0.5 1633.67V39.667L413 449.667V1290.17H1257.5L1604 1633.67H0.5Z', tone: 'white', z: 0, depth: 150, out: [-1, -0.7, 0.5] },
    { d: 'M1810.5 0L1650 1592.17L1288.5 1233.17L1379 402.167H460L51.5 0H1810.5Z', tone: 'red', z: 0, depth: 150, out: [1, 0.8, -0.3] },
    { d: 'M454.5 1243.5V510.498L878 924.996L625 1006H954.5L1196.5 1243.5H454.5Z', tone: 'hot', z: 60, depth: 170, out: [-0.6, -0.3, 1.4] },
    { d: 'M1251 1192L1330 459.494H1079.5V695.494L818 459.494H519C769.167 704.827 1251 1192 1251 1192Z', tone: 'white', z: 60, depth: 170, out: [0.5, 0.4, 1.6] },
    { d: 'M612.5 782V909L719 877L612.5 782Z', tone: 'white', z: 60, depth: 220, out: [-0.8, 0.3, 2] }
  ];
  var VB_W = 1811, VB_H = 1635, MID_Z = 140;

  function toShape(THREE, d) {
    var t = d.match(/[MLHVCZ]|-?\d*\.?\d+/g), i = 0, cmd, x = 0, y = 0, s = new THREE.Shape();
    function n() { return +t[i++]; }
    function px(v) { return v - VB_W / 2; }
    function py(v) { return VB_H / 2 - v; }
    while (i < t.length) {
      if (/[A-Z]/.test(t[i])) cmd = t[i++];
      if (cmd === 'M') { x = n(); y = n(); s.moveTo(px(x), py(y)); cmd = 'L'; }
      else if (cmd === 'L') { x = n(); y = n(); s.lineTo(px(x), py(y)); }
      else if (cmd === 'H') { x = n(); s.lineTo(px(x), py(y)); }
      else if (cmd === 'V') { y = n(); s.lineTo(px(x), py(y)); }
      else if (cmd === 'C') {
        var a = n(), b = n(), c = n(), e = n(); x = n(); y = n();
        s.bezierCurveTo(px(a), py(b), px(c), py(e), px(x), py(y));
      }
    }
    return s;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function start(THREE) {
    var root = document.documentElement;
    var canvas = document.createElement('canvas');
    canvas.id = 'gl';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    var FOV = 30, CAMZ = 12, tanHalf = Math.tan(FOV * Math.PI / 360);
    var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = CAMZ;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a7a, 1.8));
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    var key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3, 4, 10);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xff2a2a, 2.2);
    rim.position.set(-6, -3, -4);
    scene.add(rim);

    // Logo: outer group follows the .mark box, inner group carries the rotation around the logo's centre
    var logo = new THREE.Group(), spin = new THREE.Group(), pieces = [];
    logo.add(spin);
    scene.add(logo);
    var edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 });
    PARTS.forEach(function (p) {
      var geo = new THREE.ExtrudeGeometry(toShape(THREE, p.d), {
        depth: p.depth, curveSegments: 24, bevelEnabled: true, bevelThickness: 8, bevelSize: 5, bevelSegments: 2
      });
      var mat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.05 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat));
      spin.add(mesh);
      pieces.push({ mesh: mesh, mat: mat, tone: p.tone, z: p.z - MID_Z, out: new THREE.Vector3().fromArray(p.out).normalize() });
    });

    // Shards: the right-triangle cut used for the cert bullets, scattered through a depth range
    var tri = new THREE.Shape();
    tri.moveTo(-0.5, 0.5); tri.lineTo(0.5, 0.5); tri.lineTo(0.5, -0.5); tri.closePath();
    var shardGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.12, bevelEnabled: false });
    shardGeo.center();
    var N = innerWidth < 760 ? 32 : 64;
    var shards = new THREE.InstancedMesh(shardGeo, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 }), N);
    scene.add(shards);
    var S = [];
    for (var i = 0; i < N; i++) {
      var z = rand(-9, 2.5);
      S.push({
        x: rand(-1.05, 1.05), y: rand(-1, 1), z: z, near: (z + 9) / 11.5, s: rand(0.06, 0.24),
        r: [rand(0, 6.3), rand(0, 6.3), rand(0, 6.3)], w: [rand(-0.6, 0.6), rand(-0.6, 0.6), rand(-0.4, 0.4)],
        tone: Math.random()
      });
    }
    var dummy = new THREE.Object3D(), tmp = new THREE.Color();

    function applyPalette() {
      var cs = getComputedStyle(root);
      var c = { red: cs.getPropertyValue('--red').trim(), hot: cs.getPropertyValue('--red-hot').trim(), ink: cs.getPropertyValue('--ink').trim(), white: '#f4f0f0' };
      pieces.forEach(function (pc) { pc.mat.color.set(c[pc.tone]); });
      S.forEach(function (sh, i) { shards.setColorAt(i, tmp.set(sh.tone < 0.68 ? c.red : sh.tone < 0.9 ? c.ink : c.hot)); });
      shards.instanceColor.needsUpdate = true;
    }
    applyPalette();
    var scheme = matchMedia('(prefers-color-scheme: dark)');
    if (scheme.addEventListener) scheme.addEventListener('change', applyPalette);

    function resize() {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    addEventListener('resize', resize);
    resize();

    var mark = document.querySelector('.mark');
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 }, hover = 0, hoverT = 0;
    addEventListener('pointermove', function (e) {
      mouse.tx = e.clientX / innerWidth * 2 - 1;
      mouse.ty = e.clientY / innerHeight * 2 - 1;
      var r = mark && mark.getBoundingClientRect();
      hoverT = r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom ? 1 : 0;
    }, { passive: true });

    var t0 = performance.now(), last = t0, lastScroll = scrollY, vel = 0, shown = false;

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05), t = (now - t0) / 1000;
      var W = canvas.clientWidth, H = canvas.clientHeight, sy = scrollY;
      last = now;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      hover += (hoverT - hover) * 0.08;
      vel += (Math.abs(sy - lastScroll) / Math.max(dt, 0.001) - vel) * 0.1;
      lastScroll = sy;

      // World units per CSS pixel on the z=0 plane, so the logo lands exactly on the .mark box
      var f = 2 * tanHalf * CAMZ / H;
      var r = mark && mark.getBoundingClientRect();
      if (r && r.width && r.bottom > 0 && r.top < H) {
        logo.visible = true;
        logo.position.set((r.left + r.width / 2 - W / 2) * f, -(r.top + r.height / 2 - H / 2) * f + Math.sin(t * 1.1) * 0.05, 0);
        logo.scale.setScalar(r.width * f / VB_W);
        var p = Math.min(sy / H, 1.5);
        spin.rotation.y = Math.sin(t * 0.6) * 0.18 + mouse.x * 0.45 + p * 1.1;
        spin.rotation.x = Math.cos(t * 0.5) * 0.06 + mouse.y * 0.3 + p * 0.35;
        pieces.forEach(function (pc, i) {
          var k = clamp((t - 0.15 - i * 0.12) / 1.7, 0, 1);
          k = 1 - Math.pow(1 - k, 4);
          var off = (1 - k) * 900 + hover * 80;
          pc.mesh.position.set(pc.out.x * off, pc.out.y * off, pc.z + pc.out.z * off);
          pc.mesh.rotation.set(pc.out.y * (1 - k) * 1.4, pc.out.x * (1 - k) * 1.4, 0);
        });
      } else {
        logo.visible = false;
      }

      // Shards live in normalised screen space so they wrap cleanly; nearer ones scroll and parallax faster
      var boost = 1 + Math.min(vel / 600, 4);
      for (var i = 0; i < N; i++) {
        var sh = S[i], halfH = tanHalf * (CAMZ - sh.z), halfW = halfH * camera.aspect;
        var yn = sh.y + (0.3 + 0.7 * sh.near) * sy * 2 / H;
        yn = ((yn + 1.1) % 2.2 + 2.2) % 2.2 - 1.1;
        sh.r[0] += sh.w[0] * dt * boost; sh.r[1] += sh.w[1] * dt * boost; sh.r[2] += sh.w[2] * dt * boost;
        dummy.position.set(sh.x * halfW + mouse.x * 0.4 * sh.near, yn * halfH - mouse.y * 0.3 * sh.near, sh.z);
        dummy.rotation.set(sh.r[0], sh.r[1], sh.r[2]);
        dummy.scale.setScalar(sh.s);
        dummy.updateMatrix();
        shards.setMatrixAt(i, dummy.matrix);
      }
      shards.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      if (!shown) { shown = true; root.classList.add('gl'); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
