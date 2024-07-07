import { initBuffers } from './buffers';
import { render } from './render';
import './style.css'
import { ProgramInfo } from './types';

import vsSource from './shaders/vertex.glsl?raw';
import fsSource from './shaders/fragment.glsl?raw';
import { setupControls } from './controls';
import { loadImage } from './image';
import { initShaderProgram } from './webgl-utils';

function setupWebgl() {
    const webglCanvas = document.querySelector<HTMLCanvasElement>('#webgl-canvas');

    if (webglCanvas == null) {
        alert("Could not get canvas element");
        return;
    }

    setupControls(webglCanvas);

    const gl = webglCanvas?.getContext("webgl2");

    if (gl == null || gl == undefined) {
        alert("Could not create webgl context");
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    let shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    if (shaderProgram == null) {
        alert("could not create shader program");
        return;
    }

    const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    if (projectionMatrixLocation == null) return;

    const programInfo: ProgramInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
        },
        uniformLocations: {
            projectionMatrix: projectionMatrixLocation,
        }
    };

    const buffers = initBuffers(gl);

    if (buffers == null) {
        alert("could not create buffers");
        return;
    }

    render(gl, programInfo, buffers);
}

setupWebgl();

await loadImage();
