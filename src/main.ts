import "./style.css";

document.body.innerHTML = `
<h1 id = 'title'>Some Generic Title</h1>
`;

// Establishing a canvas
const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 256;
canvas.height = 256;
document.body.appendChild(canvas);

interface Command {
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

type MarkerStyle = "thin" | "thick";

let currentStyle: MarkerStyle = "thin"; // Default tool

// Create preview dot
const previewDot = document.createElement("div");
previewDot.style.position = "absolute";
previewDot.style.width = currentStyle === "thin" ? "6px" : "12px";
previewDot.style.height = currentStyle === "thin" ? "6px" : "12px";
previewDot.style.borderRadius = "50%";
previewDot.style.backgroundColor = "black";
previewDot.style.transform = "translate(-50%, -50%)"; // center on cursor
previewDot.style.pointerEvents = "none"; // don't interfere with clicks
previewDot.style.zIndex = "1000";
previewDot.style.display = "none"; // hidden until mouse enters canvas

// Add to body so it can float anywhere
document.body.append(previewDot);

const displayList: Command[] = [];

function createLineCommand(
  startX: number,
  startY: number,
  style: MarkerStyle,
): Command {
  const points: [number, number][] = [[startX, startY]];

  return {
    drag(x, y) {
      points.push([x, y]);
    },

    display(ctx) {
      if (points.length === 0) return;

      // ✨ Set line style here — part of the command!
      ctx.lineWidth = style === "thick" ? 6 : 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "black";

      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  };
}

let currentCommand: Command | null = null;
let isDrawing = false;
let clearSnapshot: Command[] | null = null;

canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;

  // ✅ Safe check: make sure e.target exists and is a Node
  const target = e.target;
  if (!target || !canvas.contains(target as Node)) return;

  // Invalidate undo of clear when new drawing starts
  clearSnapshot = null;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // ✅ Pass currentStyle here!
  currentCommand = createLineCommand(x, y, currentStyle);
  displayList.push(currentCommand);
  isDrawing = true;
  e.preventDefault();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !currentCommand) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentCommand.drag(x, y);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// Show preview when mouse enters canvas
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    previewDot.style.display = "none";
    return;
  }

  // Position preview dot under cursor
  previewDot.style.display = "block";
  previewDot.style.left = `${e.clientX}px`;
  previewDot.style.top = `${e.clientY}px`;
});

// Hide if mouse leaves canvas
canvas.addEventListener("mouseleave", () => {
  previewDot.style.display = "none";
});

// Also hide during actual drawing (in mousedown)
canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;

  clearSnapshot = null;
  previewDot.style.display = "none"; // hide preview

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentCommand = createLineCommand(x, y, currentStyle);
  displayList.push(currentCommand);
  isDrawing = true;
  e.preventDefault();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentCommand = null;
});

function redraw() {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of displayList) {
    command.display(ctx);
  }
}

canvas.addEventListener("drawing-changed", redraw);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.appendChild(redoButton);

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.appendChild(clearButton);

function saveClearState() {
  if (displayList.length > 0) {
    clearSnapshot = displayList.slice(); // save all commands
  }
}

clearButton.addEventListener("click", () => {
  saveClearState();

  displayList.length = 0;
  redoStack.length = 0; // clear redo when new action happens
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const undoStack: Command[] = [];
const redoStack: Command[] = [];

undoButton.addEventListener("click", () => {
  if (clearSnapshot) {
    // If there's a clear snapshot, restore it
    displayList.push(...clearSnapshot);
    clearSnapshot = null;
  } else if (displayList.length > 0) {
    const cmd = displayList.pop()!;
    redoStack.push(cmd);
  }
  canvas.dispatchEvent(new Event("drawing-changed"));
});

redoButton.addEventListener("click", () => {
  if (undoStack.length === 0) return;
  const command = undoStack.pop()!;
  displayList.push(command);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const thinButton = document.createElement("button");
thinButton.textContent = "○";
thinButton.title = "Thin Marker";
document.body.appendChild(thinButton);
const thickButton = document.createElement("button");
thickButton.textContent = "●";
thickButton.title = "Thick Marker";
document.body.appendChild(thickButton);

function updateMarkerUI() {
  // Update button styles
  thinButton.style.fontWeight = currentStyle === "thin" ? "bold" : "normal";
  thickButton.style.fontWeight = currentStyle === "thick" ? "bold" : "normal";

  // Update preview dot size
  const size = currentStyle === "thin" ? "6px" : "12px";
  previewDot.style.width = size;
  previewDot.style.height = size;
}

updateMarkerUI();

thinButton.addEventListener("click", () => {
  currentStyle = "thin";
  updateMarkerUI();
});

thickButton.addEventListener("click", () => {
  currentStyle = "thick";
  updateMarkerUI();
});

thinButton.style.fontSize = "18px";
thickButton.style.fontSize = "24px";
