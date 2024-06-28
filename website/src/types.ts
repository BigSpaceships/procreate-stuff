export type ProgramInfo = {
    program: WebGLProgram;
    attribLocations: {
        vertexPosition: number,
    };
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation, 
    }
}

export type Buffers = {
    position: WebGLBuffer;
};
