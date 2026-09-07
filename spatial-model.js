/* Pure, bounded motion poses. No timers, DOM, media or network side effects. */
((root) => {
  'use strict';
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
  const ease = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  function assembly(progress, index, width, enabled) {
    const p = clamp(progress);
    // Begin outside, converge once, then hold. Reverse scrolling retraces the same path.
    const spread = enabled ? 1 - ease(.08 + index * .035, .56 + index * .045, p) : 0;
    return { spread, z: spread * (66 + index % 3 * 16), iconZ: spread * 18,
      rx: spread * (index % 2 ? -5 : 5), ry: spread * (index % 2 ? -7 : 7),
      stage: enabled ? 1 - ease(.08, .82, p) : 0, step: p < .20 ? 0 : p < .79 ? 1 : 2 };
  }
  function tileOffset(spread, side, deviceWidth, tileWidth, slotX, startY) {
    // Measure from the final slot. Even the entire card starts clear of the hardware.
    const outerCenter = side * (deviceWidth / 2 + tileWidth / 2 + 32);
    return { x: (outerCenter - slotX) * spread, y: startY * .3 * spread };
  }
  function deviceScale(viewportHeight, deviceHeight, deviceWidth, tileWidth, visualWidth) {
    // Extra lateral space covers initial card rotation and positive-Z projection.
    const widthBudget = deviceWidth + tileWidth * 2 + 128;
    return clamp(Math.min((viewportHeight - 240) / Math.max(1, deviceHeight),
      (visualWidth - 24) / Math.max(1, widthBudget)), .6, 1);
  }
  function intro(manifestoTop, assemblyTop, featuresTop, chapterBottom, viewport) {
    return { dim: ease(viewport * .95, viewport * .12, manifestoTop) * .25
        + ease(viewport * .95, viewport * .12, assemblyTop) * .13
        + ease(viewport * .95, viewport * .12, featuresTop) * .10,
      exit: ease(viewport * .60, viewport * .06, chapterBottom) };
  }
  function feature(top, height, viewport, enabled) {
    const p = clamp((viewport - top) / Math.max(1, viewport + height));
    const enter = enabled ? 1 - ease(.02, .38, p) : 0;
    return { y: enter * 36, z: enabled ? (1 - enter) * 24 : 0,
      rx: enter * 8, photoY: enabled ? (p - .5) * 32 : 0,
      iconZ: enabled ? (1 - enter) * 32 : 0, community: enabled ? (1 - enter) : 0 };
  }
  function windowPose(top, viewport, enabled) {
    const open = enabled ? ease(viewport * .94, viewport * .06, top) : 1;
    return { inset: (1 - open) * 72, radius: (1 - open) * 36,
      panelY: (1 - open) * 24, panelRX: (1 - open) * 4, panelScale: .96 + open * .04 };
  }
  function pointer(x, y, bounds, enabled) {
    if (!enabled || !bounds.width || !bounds.height) return { rx: 0, ry: 0, x: 50, y: 50, glare: 0 };
    const px = clamp((x - bounds.left) / bounds.width), py = clamp((y - bounds.top) / bounds.height);
    return { rx: (0.5 - py) * 6, ry: (px - .5) * 8, x: px * 100, y: py * 100, glare: 1 };
  }
  root.KaveoSpatial = Object.freeze({ clamp, ease, assembly, tileOffset, deviceScale, intro, feature, windowPose, pointer });
})(globalThis);
