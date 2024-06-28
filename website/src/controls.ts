import { mat4, vec3 } from "gl-matrix";

const canvasScale = 1;

export let windowWidth = 0;
export let windowHeight = 0;

export let aspect = 1;

export let projectionMatrix = mat4.create();

let pos = vec3.create();

let scale = 1;

export function calculateProjectionMatrix(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    canvas.width = windowWidth * canvasScale;
    canvas.height = windowHeight * canvasScale;

    gl.viewport(0, 0, canvas.width, canvas.height);

    aspect = windowWidth / windowHeight;

    projectionMatrix = mat4.create();

    mat4.ortho(projectionMatrix, -aspect, aspect, -1, 1, -1, 1);

    mat4.translate(projectionMatrix, projectionMatrix, pos);

    mat4.multiplyScalar(projectionMatrix, projectionMatrix, scale);
}
