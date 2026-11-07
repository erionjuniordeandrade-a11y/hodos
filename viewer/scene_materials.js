/**
 * Material presets for the atlas scene: translucent context shells.
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function materialUserData(material) {
  if (!material.userData) material.userData = {};
  return material.userData;
}

/** Context shells remain visible but cannot write the depth used by ambient occlusion. */
export function configContextMaterial(material, {
  THREE,
  opacity = 0.08,
  renderOrder,
} = {}) {
  if (!material || typeof material !== "object") {
    throw new TypeError("configContextMaterial requires a material");
  }
  material.transparent = true;
  material.opacity = clamp(Number(opacity) || 0, 0, 1);
  material.depthTest = true;
  material.depthWrite = false;
  material.premultipliedAlpha = false;
  if (THREE?.NormalBlending !== undefined) material.blending = THREE.NormalBlending;
  if (renderOrder !== undefined) material.renderOrder = renderOrder;
  materialUserData(material).renderRole = "context-shell";
  material.needsUpdate = true;
  return material;
}
