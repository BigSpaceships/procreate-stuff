import { mat4, vec3 } from "gl-matrix";

const canvasScale = 4;

export let windowWidth = 0;
export let windowHeight = 0;

export let aspect = 1;

export let projectionMatrix = mat4.create();

let pos = vec3.create();

let scale = 1;

let dragging = false;

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

    mat4.scale(projectionMatrix, projectionMatrix, [scale, scale, 1]);
}

export function setupControls(canvas: HTMLCanvasElement) {
    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("mousedown", mouseDown);
    // canvas.addEventListener("mouseenter", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    // canvas.addEventListener("mouseleave", mouseUp);
    canvas.addEventListener("wheel", zoom);
}

function mouseMove(e: MouseEvent) {
    if (dragging) {
        vec3.add(pos, pos, [e.movementX / windowWidth * 2 * aspect, -e.movementY / windowHeight * 2, 0]);
    }
}

function mouseDown(e: MouseEvent) {
    if (e.button == 0) {
        dragging = true;
    }
}

function mouseUp(e: MouseEvent) {
    if (e.button == 0) {
        dragging = false;
    }
}

const zoomStrength = .5;
function zoom(e: WheelEvent) {
    let zoomAmount = 1 / (1 + Math.exp(-e.deltaY)) - .5;
    zoomAmount *= -zoomStrength;
    zoomAmount += 1;

    scale *= zoomAmount;

    scale = Math.min(Math.max(scale, .25), 4);
    
    e.preventDefault();
}
