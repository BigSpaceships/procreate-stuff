export type ProgramInfo = {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: number,
    },
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation, 
    },
}

export type LayerProgramInfo = {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: number,
    },
    uniformLocations: {
        backgroundColor: WebGLUniformLocation,
        blendMode: WebGLUniformLocation,
        opacity: WebGLUniformLocation,
    },
}

export type Buffers = {
    position: WebGLBuffer,
};

export type Color = {
    r: number,
    g: number,
    b: number,
}

export type Layer = {
    uuid: String,
    width: number,
    height: number,
    blend_mode: number,
    opacity: number,
    locked: boolean,
    hidden: boolean,
    name: String | null,
    clipped: boolean,
}

export type ImageJson = {
    composite: Layer,

    background_color: Color,
    background_hidden: boolean,

    width: number, 
    height: number,

    orientation: number,
    flipped_horizontally: boolean,

    layers: Array<Layer>,
}
