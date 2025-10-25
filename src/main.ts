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

const displayList: Command[] = [];

function createLineCommand(startX: number, startY: number): Command {
  const points: [number, number][] = [[startX, startY]];

  return {
    drag(x, y) {
      points.push([x, y]);
    },
    display(ctx) {
      if (points.length === 0) return;
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
  if (e.button !== 0) return; // Only left-click
  clearSnapshot = null;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentCommand = createLineCommand(x, y);
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
