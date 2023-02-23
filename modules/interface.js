let el; // element selectors

function attachElements(viewInfo) {
    el = {
        settingsButton: document.querySelector("#settings-button"),
        iterationsInput: document.querySelector("#iterations-input"),
        offsetLabelX: document.querySelector("#offset-label-x"),
        offsetLabelY: document.querySelector("#offset-label-y"),
        scaleLabel: document.querySelector("#scale-label")
    };

    el.iterationsInput.value = viewInfo.iterations;
}

function initEventListeners() {
    el.settingsButton.onclick = handleSettingsClick;
}

function handleSettingsClick() {
    this.parentElement.classList.toggle("menu-active");
}

function handleIterationsChange(viewInfo) {
    let value = el.iterationsInput.value;

    // assure value is a positive integer
    if (value < 0) { value = 0 }
    if (value % 1 != 0) { value = Math.round(value);}
    if (value > 10000) { value = 10000; }

    viewInfo.iterations = value;
    el.iterationsInput.value = viewInfo.iterations;
}

function updateLabels(viewInfo) {
    el.offsetLabelX.innerHTML = `x: ${formatFloat(viewInfo.offset.x)}`;
    el.offsetLabelY.innerHTML = `x: ${formatFloat(viewInfo.offset.y)}`;
    el.scaleLabel.innerHTML = `scale: ${formatFloat(viewInfo.scale)}`;
}

function formatFloat(n) {
    return n.toFixed(5);
}

export { attachElements, initEventListeners, handleIterationsChange, updateLabels };