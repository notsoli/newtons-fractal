import * as Graphics from './modules/graphics.js';
import * as Interact from './modules/interact.js';
import * as Interface from './modules/interface.js';

window.onload = main;

async function main() {
    const canvas = document.querySelector("#gl-canvas");
    const interactCanvas = document.querySelector("#interact-canvas");

    // TODO: maybe consolidate these into a uniforms object?
    // lots of functions take colors and roots together
    let colors = [
        {r: 0.337, g: 0.443, b: 0.537},
        {r: 0.482, g: 0.561, b: 0.631},
        {r: 0.812, g: 0.725, b: 0.592},
        {r: 0.980, g: 0.839, b: 0.647},
        {r: 0.259, g: 0.345, b: 0.412}
    ];

    let roots = [
        {x: -1.3247, y: 0.0},
        {x: 0.0, y: 1.0},
        {x: 0.0, y: -1.0},
        {x: 0.66236, y: 0.56228},
        {x: 0.66236, y: -0.56228}
    ];

    let viewInfo = {
        scale: 0.5,
        offset: {x: 0.0, y: 0.0},
        pixelRatio: 2,
        canvas: canvas,
        iterations: 10
    };

    viewInfo.canvas.width = window.innerWidth * viewInfo.pixelRatio;
    viewInfo.canvas.height = window.innerHeight * viewInfo.pixelRatio;
    await Graphics.initWebGL(canvas);

    // calculate initial uniforms
    Graphics.modifyColors(colors);
    Graphics.modifyRoots(roots);
    Graphics.modifyIterations(viewInfo.iterations);

    Interact.setCanvas(interactCanvas, viewInfo);
    Interface.attachElements(viewInfo);

    refreshViewWindow(viewInfo, roots, colors);

    // make interface interactable
    Interface.initEventListeners();
    initInterfaceEventHandlers(viewInfo);
    initMouseEventHandlers(viewInfo, roots, colors);
}

function initMouseEventHandlers(viewInfo, roots, colors) {
    onresize = () => {
        viewInfo.canvas.width = window.innerWidth * viewInfo.pixelRatio;
        viewInfo.canvas.height = window.innerHeight * viewInfo.pixelRatio;
        refreshViewWindow(viewInfo, roots, colors);
    }

    onmousedown = (event) => {
        Interact.handleMouseDown(event, viewInfo);
    };
    document.addEventListener("touchstart", (event) => {
        Interact.handleMouseDown(event.changedTouches[0], viewInfo);
    });

    onmousemove = (event) => {
        const updated = Interact.handleMouseMove(event, viewInfo, roots);
        if (updated) {
            Graphics.modifyRoots(roots);
            refreshViewWindow(viewInfo, roots, colors);
        }
    };
    document.addEventListener("touchmove", (event) => {
        const updated = Interact.handleMouseMove(event.changedTouches[0], viewInfo, roots);
        if (updated) {
            Graphics.modifyRoots(roots);
            refreshViewWindow(viewInfo, roots, colors);
        }
    });

    onmouseup = () => {
        Interact.handleMouseUp();
    };
    document.addEventListener("touchend", (event) => {
        Interact.handleMouseUp();
    });

    onwheel = (event) => {
        Interact.handleMouseScroll(event, viewInfo);
        Graphics.modifyRoots(roots);
        refreshViewWindow(viewInfo, roots, colors);
    };
}

function initInterfaceEventHandlers(viewInfo) {
    document.querySelector("#iterations-input").onchange = () => {
        Interface.handleIterationsChange(viewInfo);
        Graphics.modifyIterations(viewInfo.iterations);
        Graphics.drawScene();
    }
}

// apply view window and update components that depend on it
// essentially represents a state change
function refreshViewWindow(viewInfo, roots, colors) {
    Graphics.applyViewWindow(viewInfo);
    Graphics.drawScene();
    Interact.refreshHandles(viewInfo, roots, colors);
    Interface.updateLabels(viewInfo);
}