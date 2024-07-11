import { Buffers, ImageJson, Layer, LayerProgramInfo } from "./types";
import { initShaderProgram } from "./webgl-utils";

import vsSource from './shaders/layerVertex.glsl?raw';
import fsSource from './shaders/layerFragment.glsl?raw';
import { initBuffers } from "./buffers";
import { mat4 } from "gl-matrix";
import { loadTexture, setPositionAttribute, setUVAttribute } from "./util";

export async function loadImage(onComplete: (img: ImageBitmap) => void) {
    let imgJson = await fetch("/image/Document.json");
    let json = await imgJson.json();

    let image = json as ImageJson;

    let width = image.width;
    let height = image.height;

    const offscreenCanvas = new OffscreenCanvas(width, height);

    const gl = offscreenCanvas.getContext("webgl2");

    if (gl == null) {
        alert("could not create offscreen canvas");
        return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    if (shaderProgram == null) {
        alert("could not create shader program");
        return;
    }

    // alert(gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS));
    const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    // if (backgroundColorLocation == null) return;

    const blendModeLocation = gl.getUniformLocation(shaderProgram, "uBlendMode");
    // if (blendModeLocation == null) return;

    const opacityLocation = gl.getUniformLocation(shaderProgram, "uOpacity");

    const samplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");
    const currentTextureLocation = gl.getUniformLocation(shaderProgram, "uCurrentTexture");
    // if (opacityLocation == null) return;

    const programInfo: LayerProgramInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            uvCoord: gl.getAttribLocation(shaderProgram, "aUVCoord"),
        },
        uniformLocations: {
            projectionMatrix: projectionMatrixLocation,
            sampler: samplerLocation,
            currentTexture: currentTextureLocation,
            blendMode: blendModeLocation,
            opacity: opacityLocation,
        },
    }

    const buffers = initBuffers(gl);

    if (buffers == null) {
        alert("could not create buffers");
        return;
    }

    await renderImage(gl, programInfo, buffers, image, onComplete);
}

export async function renderImage(gl: WebGL2RenderingContext, programInfo: LayerProgramInfo, buffers: Buffers, 
                                  imageData: ImageJson, onComplete: (img: ImageBitmap) => void) {

    setPositionAttribute(gl, programInfo, buffers);
    setUVAttribute(gl, programInfo, buffers);

    gl.useProgram(programInfo?.program);

    let backgroundPixel = imageData.background_hidden ? [0, 0, 0, 0] :
        [imageData.background_color.r * 255, imageData.background_color.g * 255, imageData.background_color.b * 255, 255];

    let currentResultTexture = gl.createTexture();

    if (currentResultTexture == null) {
        return;
    }

    gl.bindTexture(gl.TEXTURE_2D, currentResultTexture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(backgroundPixel));

    var image: ImageBitmap;

    for (let i = 0; i < imageData.layers.length; i++) {
    // for (let i = 0; i < 6; i++) {
        const result = await renderLayer(gl, programInfo, imageData.layers[i], currentResultTexture);

        if (result == null || result == undefined) {
            continue;
        }

        gl.bindTexture(gl.TEXTURE_2D, currentResultTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, result);

        image = result;
    }

    if (true) {
        onComplete(image);
    } else {
        requestAnimationFrame(async () => { await renderImage(gl, programInfo, buffers, imageData, onComplete) });
    }

    console.log(gl.getProgramInfoLog(programInfo.program));
}

async function renderLayer(gl: WebGL2RenderingContext, programInfo: LayerProgramInfo, layer: Layer, currentResultTexture: WebGLTexture): Promise<void | ImageBitmap | undefined> {
    console.log(layer);

    if (layer.hidden) {
        return undefined;
    }

    gl.useProgram(programInfo.program);

    // load texture 

    const texture = await loadTexture(gl, `image/${layer.uuid}.png`);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.sampler, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, currentResultTexture);
    gl.uniform1i(programInfo.uniformLocations.currentTexture, 1);

    var projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -1, 1, -1, 1, -1, 1);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return (gl.canvas as OffscreenCanvas).transferToImageBitmap();
}
