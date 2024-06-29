import { initBuffers } from './buffers';
import { render } from './render';
import './style.css'
import { ProgramInfo } from './types';

import vsSource from './shaders/vertex.glsl?raw';
import fsSource from './shaders/fragment.glsl?raw';
import { setupControls } from './controls';

function loadShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader | null {
    const shader = gl.createShader(type);

    if (shader == null) {
        return null;
    }

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(
            `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
        );
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initShaderProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (vertexShader == null || fragmentShader == null) return null;

    const shaderProgram = gl.createProgram();

    if (shaderProgram == null) return null;

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(
            `Unable to initialize the shader program: ${gl.getProgramInfoLog(
                shaderProgram,
            )}`,
        );
        return null;
    }

    return shaderProgram;
}

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
