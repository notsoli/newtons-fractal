// lots of code is adapted from 
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial

let gl;
let programInfo;
let buffers;

// set up WebGL context, 
async function initWebGL(canvas) {
    // initialize WebGL context
    gl = canvas.getContext("webgl");

    // only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    
    // set clear color to black and clear color buffer
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // grab shader files
    let vertexSource = await grabShader("/shaders/shader.vert");
    let fragmentSource = await grabShader("/shaders/shader.frag");

    // initialize shader program
    const shaderProgram = initShaderProgram(vertexSource, fragmentSource);

    // collect all the info needed to use the shader program
    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "a_vertexPosition"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "u_projectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "u_modelViewMatrix"),
            resolution: gl.getUniformLocation(shaderProgram, "u_resolution"),
            viewWindow: gl.getUniformLocation(shaderProgram, "u_viewWindow"),
            colors: gl.getUniformLocation(shaderProgram, "u_colors"),
            roots: gl.getUniformLocation(shaderProgram, "u_roots"),
            iterations: gl.getUniformLocation(shaderProgram, "u_iterations")
        },
    };

    // initialize position buffer for plane
    buffers = initPositionBuffer();

    // tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);
}

// grab shaders from file
async function grabShader(path) {
    return new Promise(resolve => {
        fetch(path)
            .then(response => response.text())
            .then((data) => {resolve(data);})
    });
}

// initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(vertexSource, fragmentSource) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentSource);
  
    // create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    // if creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(`Unable to initialize the shader program:${gl.getProgramInfoLog(shaderProgram)}`);
      return null;
    }
  
    return shaderProgram;
}
  
// creates a shader of the given type, uploads the source and compiles it
function loadShader(type, source) {
    const shader = gl.createShader(type);

    // send the source to the shader object and compile
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // see if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// create a square, as well as a position buffer to represent it
function initPositionBuffer() {
    // create a buffer for the square's positions
    const positionBuffer = gl.createBuffer();
  
    // select the positionBuffer as the one to apply buffer operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    // create an array of positions for the square.
    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
  
    // pass the list of positions into WebGL to build the shape
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    return {position: positionBuffer};
}

// draw a plane covering the viewport
function drawScene() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // clear to black, fully opaque
    gl.clearDepth(1.0); // clear everything
  
    // clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    // tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
    setPositionAttribute();
  
    // tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);
  
    const projectionMatrix = new Float32Array([
        1,  0,  0,  0,
        0,  1,  0,  0,
        0,  0, -1, -1,
        0,  0,  0,  0
    ]);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );

    const modelViewMatrix = new Float32Array([
        1,  0,  0,  0,
        0,  1,  0,  0,
        0,  0,  1,  0,
        0,  0, -1,  1
    ]);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
    );

    // draw plane
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
}

// set vertex positions for plane
function setPositionAttribute() {
    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

// calculate a start and end uv
function calculateViewWindow(viewInfo) {
    // apply scale
    const viewWindow = {
        startX: -1/viewInfo.scale, endX: 1/viewInfo.scale,
        startY: -1/viewInfo.scale, endY: 1/viewInfo.scale,
    };

    // apply aspect ratio
    const ratio = viewInfo.canvas.width/viewInfo.canvas.height;
    if (ratio > 1) {
        viewWindow.startX *= ratio;
        viewWindow.endX *= ratio;
    } else {
        viewWindow.startY /= ratio;
        viewWindow.endY /= ratio;
    }

    // apply offset
    viewWindow.startX += viewInfo.offset.x;
    viewWindow.endX += viewInfo.offset.x;
    viewWindow.startY += viewInfo.offset.y;
    viewWindow.endY += viewInfo.offset.y;

    return viewWindow;
}

function applyViewWindow(viewInfo) {
    const viewWindow = calculateViewWindow(viewInfo);
    
    // calculate new canvas size
    const newCanvasWidth = gl.canvas.clientWidth * viewInfo.pixelRatio;
    const newCanvasHeight = gl.canvas.clientHeight * viewInfo.pixelRatio;

    // convert viewInfo object into an array
    const viewWindowArray = [
        viewWindow.startX, viewWindow.endX,
        viewWindow.startY, viewWindow.endY
    ];

    // set viewWindow uniform
    gl.uniform1fv(
        programInfo.uniformLocations.viewWindow,
        viewWindowArray
    );

    // set resolution uniform
    gl.uniform2fv(
        programInfo.uniformLocations.resolution,
        [ newCanvasWidth, newCanvasHeight ]
    );

    // set canvas viewport to new dimensions
    gl.viewport(0, 0, newCanvasWidth, newCanvasHeight);
}

function modifyColors(colors) {
    let colorsArray = [];
    colors.forEach(color => {
        colorsArray.push(color.r);
        colorsArray.push(color.g);
        colorsArray.push(color.b);
    });
    gl.uniform3fv(
        programInfo.uniformLocations.colors,
        colorsArray
    );
}

function modifyRoots(roots) {
    let rootsArray = [];
    roots.forEach(root => {
        rootsArray.push(root.x);
        rootsArray.push(root.y);
    });
    gl.uniform2fv(
        programInfo.uniformLocations.roots,
        rootsArray
    );
}

function modifyIterations(iterations) {
    gl.uniform1i(
        programInfo.uniformLocations.iterations,
        iterations
    );
}

export {
    initWebGL, drawScene, calculateViewWindow,
    applyViewWindow, modifyColors, modifyRoots, modifyIterations
}