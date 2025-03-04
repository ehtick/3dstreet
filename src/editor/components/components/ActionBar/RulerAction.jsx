import pickPointOnGroundPlane from '../../../lib/pick-point-on-ground-plane';

/**
 * Functions for managing the ruler cursor entity in the 3D scene
 */

/**
 * Creates and shows the ruler cursor entity with animated rings
 */
export function fadeInRulerCursorEntity() {
  let rulerCursorEntity = document.getElementById('rulerCursorEntity');
  if (!rulerCursorEntity) {
    rulerCursorEntity = document.createElement('a-entity');
    rulerCursorEntity.setAttribute('id', 'rulerCursorEntity');
    rulerCursorEntity.classList.add('hideFromSceneGraph');
    rulerCursorEntity.innerHTML = `
        <a-ring class="hideFromSceneGraph" rotation="-90 0 0" material="depthTest: false" radius-inner="0.2" radius-outer="0.3">
          <a-ring class="hideFromSceneGraph" color="yellow" material="depthTest: false" radius-inner="0.4" radius-outer="0.5"
            animation="property: scale; from: 1 1 1; to: 2 2 2; loop: true; dir: alternate"></a-ring>
          <a-ring class="hideFromSceneGraph" color="yellow" material="depthTest: false" radius-inner="0.6" radius-outer="0.7"
            animation="property: scale; from: 1 1 1; to: 3 3 3; loop: true; dir: alternate"></a-ring>
          <a-entity class="hideFromSceneGraph" rotation="90 0 0">
            <a-cylinder class="hideFromSceneGraph" color="yellow" position="0 5.25 0" radius="0.05" height="2.5"></a-cylinder>
            <a-cone class="hideFromSceneGraph" color="yellow" position="0 4 0" radius-top="0.5" radius-bottom="0" height="1"></a-cone>
        </a-ring>`;
    AFRAME.scenes[0].appendChild(rulerCursorEntity);
  }
  rulerCursorEntity.setAttribute('visible', true);
}

/**
 * Hides the ruler cursor entity
 */
export function fadeOutRulerCursorEntity() {
  let rulerCursorEntity = document.getElementById('rulerCursorEntity');
  if (rulerCursorEntity) {
    rulerCursorEntity.setAttribute('visible', false);
  }
}

/**
 * Fetches or creates the preview measure line entity used for showing the ruler measurement
 * @returns {HTMLElement} The preview measure line entity
 */
export function fetchOrCreatePreviewMeasureLineEntity() {
  let previewMeasureLineEl = document.getElementById('previewMeasureLine');
  if (previewMeasureLineEl) {
    return previewMeasureLineEl;
  }
  // create a new entity with the measure-line component with the same dimensions
  previewMeasureLineEl = document.createElement('a-entity');
  previewMeasureLineEl.setAttribute('id', 'previewMeasureLine');
  previewMeasureLineEl.setAttribute('measure-line', '');
  previewMeasureLineEl.classList.add('hideFromSceneGraph');

  AFRAME.scenes[0].appendChild(previewMeasureLineEl);
  return previewMeasureLineEl;
}

/**
 * Handles mouse move events for the ruler tool
 * @param {MouseEvent} e - The mouse event
 * @param {boolean} hasRulerClicked - Whether the ruler has been clicked once already
 */
export function onRulerMouseMove(e, hasRulerClicked) {
  let rulerCursorEntity = document.getElementById('rulerCursorEntity');
  const position = pickPointOnGroundPlane({
    x: e.clientX,
    y: e.clientY,
    canvas: AFRAME.scenes[0].canvas,
    camera: AFRAME.INSPECTOR.camera
  });
  if (rulerCursorEntity) {
    rulerCursorEntity.object3D.position.copy(position);
  }
  if (hasRulerClicked) {
    // get the previewMeasureLine entity
    const previewMeasureLineEl = document.getElementById('previewMeasureLine');
    if (previewMeasureLineEl) {
      previewMeasureLineEl.setAttribute('measure-line', {
        end: position
      });
    }
  }
  return false;
}

/**
 * Handles mouse up events for the ruler tool
 * @param {MouseEvent} e - The mouse event
 * @param {boolean} hasRulerClicked - Whether the ruler has been clicked once already
 * @param {Function} setHasRulerClicked - Function to update hasRulerClicked state
 * @param {Function} changeTransformMode - Function to change transform mode
 * @param {number} measureLineCounter - Current measure line counter
 * @param {Function} setMeasureLineCounter - Function to update measure line counter
 */
export function onRulerMouseUp(
  e,
  hasRulerClicked,
  setHasRulerClicked,
  changeTransformMode,
  measureLineCounter,
  setMeasureLineCounter
) {
  const previewMeasureLineEl = fetchOrCreatePreviewMeasureLineEntity();
  const mouseUpPosition = pickPointOnGroundPlane({
    x: e.clientX,
    y: e.clientY,
    canvas: AFRAME.scenes[0].canvas,
    camera: AFRAME.INSPECTOR.camera
  });

  if (!hasRulerClicked) {
    previewMeasureLineEl.setAttribute('visible', true);
    // First click logic
    setHasRulerClicked(true);
    previewMeasureLineEl.setAttribute('measure-line', {
      start: mouseUpPosition,
      end: mouseUpPosition
    });
  } else {
    previewMeasureLineEl.setAttribute('visible', false);
    const startPosition =
      previewMeasureLineEl.getAttribute('measure-line').start;
    // Second click logic
    setHasRulerClicked(false);
    // now create a new entity with the measure-line component with the same dimensions
    AFRAME.INSPECTOR.execute('entitycreate', {
      components: {
        'data-layer-name': `Measure Line • ${measureLineCounter}`,
        'measure-line': {
          start: {
            x: startPosition.x,
            y: startPosition.y,
            z: startPosition.z
          },
          end: {
            x: mouseUpPosition.x,
            y: mouseUpPosition.y,
            z: mouseUpPosition.z
          }
        }
      }
    });
    // select the translate tools to show measure line controls
    changeTransformMode('translate');
    setMeasureLineCounter((prev) => prev + 1);
  }
}
