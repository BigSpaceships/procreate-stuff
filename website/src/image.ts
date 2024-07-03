import { Buffers, ImageJson, Layer, LayerProgramInfo } from "./types";
import { initShaderProgram } from "./webgl-utils";

import vsSource from './shaders/vertex.glsl?raw';
import fsSource from './shaders/fragment.glsl?raw';
import { initBuffers } from "./buffers";
import { setPositionAttribute } from "./render";

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

    offscreenWebGL.clearColor(0.0, 0.0, 0.0, 0.0);

    offscreenWebGL.clear(offscreenWebGL.COLOR_BUFFER_BIT);

    const shaderProgram = initShaderProgram(offscreenWebGL, vsSource, fsSource);

    if (shaderProgram == null) {
        alert("could not create shader program");
        return;
    }

    // alert(offscreenWebGL.getProgramParameter(shaderProgram, offscreenWebGL.ACTIVE_UNIFORMS));

    const backgroundColorLocation = offscreenWebGL.getUniformLocation(shaderProgram, "uBackgroundColor");
    // if (backgroundColorLocation == null) return;

    const blendModeLocation = offscreenWebGL.getUniformLocation(shaderProgram, "uBlendMode");
    // if (blendModeLocation == null) return;

    const opacityLocation = offscreenWebGL.getUniformLocation(shaderProgram, "uOpacity");
    // if (opacityLocation == null) return;

    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: offscreenWebGL.getAttribLocation(shaderProgram, "aVertexPosition"),
        },
        uniformLocations: {
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

    offscreenWebGL.useProgram(programInfo?.program);

    offscreenWebGL.clearColor(0.0, 0.0, 0.0, 0.0);

    offscreenWebGL.clear(offscreenWebGL.COLOR_BUFFER_BIT);

    setPositionAttribute(offscreenWebGL, programInfo, buffers);

    // for (let i = 0; i++; i < imageData.layers.length) {
    //     let image = renderLayer(imageData.layers[i]);        
    // }
    renderLayer(imageData.composite);

    let blob = await offscreenCanvas.convertToBlob();

    let url = URL.createObjectURL(blob);

    window.open(url, undefined, `width=200,height=200,popup`);
}

async function renderLayer(layer: Layer): Promise<void | ImageBitmap | undefined> {
    if (imageData == null || offscreenWebGL == null) {
        return undefined;
    }

    let layerImg = await fetch(`image/${layer.uuid}.png`);

    let layerArrayBuffer = await layerImg.arrayBuffer();

    // const texture = offscreenWebGL.createTexture();

    // offscreenWebGL.bindTexture(offscreenWebGL.TEXTURE_2D, texture);

    // offscreenWebGL.texImage2D(offscreenWebGL.TEXTURE_2D, 0, offscreenWebGL.RGBA, imageData.width, imageData.height, 0, offscreenWebGL.RGBA, offscreenWebGL.UNSIGNED_BYTE, layerArrayBuffer);

    // offscreenWebGL.generateMipmap(offscreenWebGL.TEXTURE_2D);

    offscreenWebGL.clearColor(0.0, 0.0, 0.0, 0.0);

    offscreenWebGL.clear(offscreenWebGL.COLOR_BUFFER_BIT);

    offscreenWebGL.drawArrays(offscreenWebGL.TRIANGLE_STRIP, 0, 4);

    // return offscreenCanvas?.transferToImageBitmap();
}
