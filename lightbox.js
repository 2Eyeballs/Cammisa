(function () {
    var links = Array.prototype.slice.call(document.querySelectorAll('.recent-detail a.recent-thumb'));
    if (!links.length) return;

    var MAX_SCALE = 6;
    var index = 0;
    var scale = 1, tx = 0, ty = 0;

    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
        '<button class="lightbox-close" aria-label="Close">&times;</button>' +
        '<button class="lightbox-prev" aria-label="Previous">&#8249;</button>' +
        '<img class="lightbox-img" alt="" draggable="false">' +
        '<button class="lightbox-next" aria-label="Next">&#8250;</button>' +
        '<div class="lightbox-count"></div>';
    document.body.appendChild(overlay);

    var img = overlay.querySelector('.lightbox-img');
    var count = overlay.querySelector('.lightbox-count');

    function clamp() {
        var maxX = Math.max(0, (img.offsetWidth * scale - overlay.clientWidth) / 2);
        var maxY = Math.max(0, (img.offsetHeight * scale - overlay.clientHeight) / 2);
        tx = Math.min(maxX, Math.max(-maxX, tx));
        ty = Math.min(maxY, Math.max(-maxY, ty));
    }

    function apply() {
        clamp();
        img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
        img.classList.toggle('zoomed', scale > 1);
    }

    function resetZoom() {
        scale = 1; tx = 0; ty = 0;
        apply();
    }

    // Zoom to newScale keeping the point (cx, cy), measured from the screen centre, fixed.
    function zoomAt(newScale, cx, cy) {
        newScale = Math.min(MAX_SCALE, Math.max(1, newScale));
        var ratio = newScale / scale;
        tx = cx - (cx - tx) * ratio;
        ty = cy - (cy - ty) * ratio;
        scale = newScale;
        apply();
    }

    function fromCenter(e) {
        var r = overlay.getBoundingClientRect();
        return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
    }

    function show(i) {
        index = (i + links.length) % links.length;
        var link = links[index];
        var thumb = link.querySelector('img');
        resetZoom();
        img.src = link.getAttribute('href');
        img.alt = thumb ? thumb.alt : '';
        count.textContent = (index + 1) + ' / ' + links.length;
        // Preload neighbours so arrow-key stepping feels instant.
        [index - 1, index + 1].forEach(function (n) {
            var pre = new Image();
            pre.src = links[(n + links.length) % links.length].getAttribute('href');
        });
    }

    function open(i) {
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
        show(i);
    }

    function close() {
        overlay.hidden = true;
        document.body.style.overflow = '';
    }

    links.forEach(function (link, i) {
        link.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey) return;
            e.preventDefault();
            open(i);
        });
    });

    overlay.addEventListener('click', function (e) {
        if (e.target.classList.contains('lightbox-prev')) show(index - 1);
        else if (e.target.classList.contains('lightbox-next')) show(index + 1);
        else if (e.target !== img) close();
    });

    document.addEventListener('keydown', function (e) {
        if (overlay.hidden) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
        else if (e.key === 'Escape') close();
        else if (e.key === '+' || e.key === '=') zoomAt(scale * 1.5, 0, 0);
        else if (e.key === '-' || e.key === '_') zoomAt(scale / 1.5, 0, 0);
        else if (e.key === '0') resetZoom();
    });

    // Wheel and trackpad pinch (browsers report pinch as ctrl+wheel).
    overlay.addEventListener('wheel', function (e) {
        e.preventDefault();
        var p = fromCenter(e);
        var factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
        zoomAt(scale * factor, p.x, p.y);
    }, { passive: false });

    // Pointer handling: click toggles zoom, drag pans, two fingers pinch.
    var pointers = {};
    var pinchDist = 0;
    var dragStart = null;
    var moved = false;

    function pointerList() {
        return Object.keys(pointers).map(function (k) { return pointers[k]; });
    }

    img.addEventListener('pointerdown', function (e) {
        img.setPointerCapture(e.pointerId);
        pointers[e.pointerId] = e;
        var list = pointerList();
        if (list.length === 1) {
            moved = false;
            dragStart = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
        } else if (list.length === 2) {
            pinchDist = Math.hypot(list[0].clientX - list[1].clientX, list[0].clientY - list[1].clientY);
            dragStart = null;
            moved = true;
        }
    });

    img.addEventListener('pointermove', function (e) {
        if (!pointers[e.pointerId]) return;
        pointers[e.pointerId] = e;
        var list = pointerList();
        if (list.length === 2) {
            var d = Math.hypot(list[0].clientX - list[1].clientX, list[0].clientY - list[1].clientY);
            var mid = fromCenter({ clientX: (list[0].clientX + list[1].clientX) / 2, clientY: (list[0].clientY + list[1].clientY) / 2 });
            if (pinchDist) zoomAt(scale * d / pinchDist, mid.x, mid.y);
            pinchDist = d;
        } else if (dragStart) {
            var dx = e.clientX - dragStart.x;
            var dy = e.clientY - dragStart.y;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
            if (scale > 1) {
                tx = dragStart.tx + dx;
                ty = dragStart.ty + dy;
                apply();
            }
        }
    });

    function endPointer(e) {
        if (!pointers[e.pointerId]) return;
        delete pointers[e.pointerId];
        var remaining = pointerList();
        if (remaining.length === 1) {
            dragStart = { x: remaining[0].clientX, y: remaining[0].clientY, tx: tx, ty: ty };
        } else if (!remaining.length) {
            if (e.type === 'pointerup' && !moved && dragStart) {
                if (scale > 1) resetZoom();
                else { var p = fromCenter(e); zoomAt(2.5, p.x, p.y); }
            }
            dragStart = null;
        }
    }
    img.addEventListener('pointerup', endPointer);
    img.addEventListener('pointercancel', endPointer);

    // Swipe between images only while not zoomed in.
    var startX = null;
    overlay.addEventListener('touchstart', function (e) {
        startX = (e.touches.length === 1 && scale === 1) ? e.touches[0].clientX : null;
    }, { passive: true });
    overlay.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });
})();
