import { initBuffers } from './buffers';
import { render } from './render';
import './style.css'
import { ProgramInfo } from './types';

import vsSource from './shaders/vertex.glsl?raw';
import fsSource from './shaders/fragment.glsl?raw';
import { setupControls } from './controls';
import { loadImage } from './image';
import { initShaderProgram } from './webgl-utils';
import { loadTexture } from './util';

async function setupWebgl() {
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

    const samplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");
    if (samplerLocation == null) return;

    const programInfo: ProgramInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            uvCoord: gl.getAttribLocation(shaderProgram, "aUVCoord"),
        },
        uniformLocations: {
            projectionMatrix: projectionMatrixLocation,
            sampler: samplerLocation,
        }
    };

    const buffers = initBuffers(gl);

    if (buffers == null) {
        alert("could not create buffers");
        return;
    }

    const renderedTexture = gl.createTexture();

    if (renderedTexture == null) return;
    gl.bindTexture(gl.TEXTURE_2D, renderedTexture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

    render(gl, programInfo, buffers, renderedTexture);

    await loadImage((result) => {
        loadTexture(gl, result, renderedTexture);
    });
}

await setupWebgl();

