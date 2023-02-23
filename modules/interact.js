import { calculateViewWindow } from './graphics.js'; 

let canvas;
let ctx;
let coords = [];

const Actions = {
    None: 0,
    Drag: 1,
    Pan: 2,
}

const handleRadius = 36;
const outlineSize = 6;
const updateBuffer = 5;

const interactionState = {
    activeHandle: null,
    currentAction: Actions.None,
    lastUpdateTime: 0,
    panPosition: null
}

function setCanvas(targetCanvas, viewInfo) {
    canvas = targetCanvas;
    ctx = canvas.getContext("2d");
    canvas.width = viewInfo.canvas.width;
    canvas.height = viewInfo.canvas.height;
}

function handleMouseDown(event, viewInfo) {
    // assume user is panning
    interactionState.currentAction = Actions.Pan;
    interactionState.panPosition = pixelToUV(event.clientX, event.clientY, viewInfo);

    // calculate mouse position adjusted for pixel density
    const mousePosition = {x: event.clientX * viewInfo.pixelRatio, y: event.clientY * viewInfo.pixelRatio};

    // check if user is dragging handle
    coords.forEach((coord, i) => {
        const dist = distanceSquared(coord, mousePosition);
        if (dist < handleRadius*handleRadius) {
            interactionState.currentAction = Actions.Drag;
            interactionState.activeHandle = i;
            interactionState.lastUpdateTime = Date.now();
        }
    })
}

function handleMouseMove(event, viewInfo, roots) {
    // ignore move event if no action is being performed or it is too new
    if (interactionState.currentAction == Actions.None) { return false; }
    if (Date.now() - interactionState.lastUpdateTime < updateBuffer) { return false; }

    const cursorUV =  pixelToUV(event.clientX, event.clientY, viewInfo);
    interactionState.lastUpdateTime = Date.now();

    if (interactionState.currentAction == Actions.Drag) {
        // update root position
        roots[interactionState.activeHandle] = cursorUV;
        return true;
    } else if (interactionState.currentAction == Actions.Pan) {
        // move offset by how much the mouse has moved
        viewInfo.offset.x -= cursorUV.x - interactionState.panPosition.x;
        viewInfo.offset.y -= cursorUV.y - interactionState.panPosition.y;
        return true;
    }
}

function handleMouseUp() {
    interactionState.currentAction = Actions.None;
}

function handleMouseScroll(event, viewInfo) {
    let scaleFactor;
    if (event.deltaY < 0) {
        scaleFactor = 1 + (event.deltaY / -1000);
    } else {
        scaleFactor = 1 / (1 + (event.deltaY / 1000));
    }
    viewInfo.scale *= scaleFactor;

    const cursorUV =  pixelToUV(event.clientX, event.clientY, viewInfo);
    viewInfo.offset.x += (cursorUV.x - viewInfo.offset.x) * (scaleFactor - 1);
    viewInfo.offset.y += (cursorUV.y - viewInfo.offset.y) * (scaleFactor - 1);
}

// translate cursor position into "shader" position, or uv
function pixelToUV(x, y, viewInfo) {
    const viewWindow = calculateViewWindow(viewInfo);
    return {
        x: viewWindow.startX + (x * viewInfo.pixelRatio / canvas.width) * (viewWindow.endX - viewWindow.startX),
        y: viewWindow.startY + (1 - y * viewInfo.pixelRatio / canvas.height) * (viewWindow.endY - viewWindow.startY)
    }
}

function refreshHandles(viewInfo, roots, colors) {
    canvas.width = viewInfo.canvas.width;
    canvas.height = viewInfo.canvas.height;

    updateHandleLocations(viewInfo, roots);
    drawHandles(colors);
}

function updateHandleLocations(viewInfo, roots) {
    const viewWindow = calculateViewWindow(viewInfo);

    for (let i = 0; i < roots.length; i++) {
        // perform an inverse lerp on the root given the view window
        let rootUV = {
            x: (roots[i].x - viewWindow.startX) / (viewWindow.endX - viewWindow.startX), 
            y: (roots[i].y - viewWindow.startY) / (viewWindow.endY - viewWindow.startY)
        };

        // translate those uv values into pixel coordinates and append it to pixel coordinate array
        // canvas uses a different coordinate system than webgl, so we need to rreverse the y value
        coords[i] = {
            x: Math.round(rootUV.x*canvas.width),
            y: Math.round((1-rootUV.y)*canvas.height)
        };
    }
}

function drawHandles(colors) {
    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw a handle at each x,y coordinate
    for (let i = 0; i < coords.length; i++) {
        ctx.fillStyle = `rgb(
            ${Math.round(colors[i].r*255)},
            ${Math.round(colors[i].g*255)},
            ${Math.round(colors[i].b*255)}
        )`;
        ctx.lineWidth = outlineSize;
        ctx.strokeStyle = 'white';

        ctx.beginPath();
        ctx.arc(coords[i].x, coords[i].y, handleRadius-outlineSize, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

function distanceSquared(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

export {
    setCanvas, handleMouseDown, handleMouseMove,
    handleMouseUp, handleMouseScroll,
    refreshHandles, drawHandles
};