import { Buffers, ImageJson, Layer, LayerProgramInfo } from "./types";
import { initShaderProgram } from "./webgl-utils";

import vsSource from './shaders/layerVertex.glsl?raw';
import fsSource from './shaders/layerFragment.glsl?raw';
import { initBuffers } from "./buffers";
import { mat4 } from "gl-matrix";

export var offscreenCanvas: OffscreenCanvas | undefined;

var programInfo: LayerProgramInfo | null;
var buffers: Buffers | null;

var imageData: ImageJson | null;

var offscreenWebGL: WebGL2RenderingContext | null;

export async function loadImage() {
    let imgJson = await fetch("/image/Document.json");
    let json = await imgJson.json();

    let image = json as ImageJson;

    let width = image.width;
    let height = image.height;

    offscreenCanvas = new OffscreenCanvas(width, height);

    offscreenWebGL = offscreenCanvas.getContext("webgl2");

    if (offscreenWebGL == null) {
        alert("could not create offscreen canvas");
        return;
    }

    const shaderProgram = initShaderProgram(offscreenWebGL, vsSource, fsSource);

    if (shaderProgram == null) {
        alert("could not create shader program");
        return;
    }

    // alert(offscreenWebGL.getProgramParameter(shaderProgram, offscreenWebGL.ACTIVE_UNIFORMS));
    const backgroundColorLocation = offscreenWebGL.getUniformLocation(shaderProgram, "uBackgroundColor");

    const projectionMatrixLocation = offscreenWebGL.getUniformLocation(shaderProgram, "uProjectionMatrix");
    // if (backgroundColorLocation == null) return;

    const blendModeLocation = offscreenWebGL.getUniformLocation(shaderProgram, "uBlendMode");
    // if (blendModeLocation == null) return;

    const opacityLocation = offscreenWebGL.getUniformLocation(shaderProgram, "uOpacity");

    const samplerLocation = offscreenWebGL.getUniformLocation(shaderProgram, "uSampler");
    // if (opacityLocation == null) return;

    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: offscreenWebGL.getAttribLocation(shaderProgram, "aVertexPosition"),
            uvCoord: offscreenWebGL.getAttribLocation(shaderProgram, "aUVCoord"),
        },
        uniformLocations: {
            projectionMatrix: projectionMatrixLocation,
            sampler: samplerLocation,
            backgroundColor: backgroundColorLocation,
            blendMode: blendModeLocation,
            opacity: opacityLocation,
        },
    }

    buffers = initBuffers(offscreenWebGL);

    if (buffers == null) {
        alert("could not create buffers");
        return;
    }

    imageData = image;

    await renderImage();
}

export async function renderImage() {
    if (offscreenCanvas == undefined || offscreenWebGL == null || imageData == null || programInfo == null || buffers == null) {
        alert("oops");
        return null; //huh i fucked up
    }

    {
        const numComponents = 2;
        const type = offscreenWebGL.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        offscreenWebGL.bindBuffer(offscreenWebGL.ARRAY_BUFFER, buffers.position);

        offscreenWebGL.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );

        offscreenWebGL.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    {
        const numComponents = 2;
        const type = offscreenWebGL.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        offscreenWebGL.bindBuffer(offscreenWebGL.ARRAY_BUFFER, buffers.uvs);

        offscreenWebGL.vertexAttribPointer(
            programInfo.attribLocations.uvCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );

        offscreenWebGL.enableVertexAttribArray(programInfo.attribLocations.uvCoord);
    }

    offscreenWebGL.useProgram(programInfo?.program);

    await renderLayer(imageData.composite);

    if (true) {
        let blob = await offscreenCanvas.convertToBlob();

        let url = URL.createObjectURL(blob);

        window.open(url, undefined, `width=200,height=200,popup`);
    } else {
        requestAnimationFrame(async () => { await renderImage() });
    }

    console.log(offscreenWebGL.getProgramInfoLog(programInfo.program));
}

async function loadTexture(gl: WebGL2RenderingContext, src: string): Promise<WebGLTexture | null> {
    return new Promise(resolve => {
        const image = new Image();

        image.onload = () => {
            const texture = gl.createTexture();

            if (texture == null) {
                return null;
            }

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            resolve(texture);
        }
        image.src = src;
    })
}

async function renderLayer(layer: Layer): Promise<void | ImageBitmap | undefined> {
    if (programInfo == null || imageData == null || offscreenWebGL == null) {
        return undefined;
    }

    offscreenWebGL.useProgram(programInfo.program);

    // load texture 

    const texture = await loadTexture(offscreenWebGL, `image/${layer.uuid}.png`);

    offscreenWebGL.activeTexture(offscreenWebGL.TEXTURE0);

    offscreenWebGL.bindTexture(offscreenWebGL.TEXTURE_2D, texture);

    offscreenWebGL.uniform1i(programInfo.uniformLocations.sampler, 0);

    var projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -1, 1, -1, 1, -1, 1);

    offscreenWebGL.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

    offscreenWebGL.clearColor(0.0, 0.0, 0.0, 1.0);

    offscreenWebGL.clear(offscreenWebGL.COLOR_BUFFER_BIT);

    offscreenWebGL.drawArrays(offscreenWebGL.TRIANGLE_STRIP, 0, 4);

    // return offscreenCanvas?.transferToImageBitmap();
}
