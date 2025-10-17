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

const ctx = canvas.getContext("2d")!;

const Points: { x: number; y: number }[][] = [];

let currentStroke: { x: number; y: number }[] | null = null;

canvas.addEventListener("mousedown", (e) => {
  currentStroke = [{ x: e.offsetX, y: e.offsetY }];
});

canvas.addEventListener("mousemove", (e) => {
  if (currentStroke) {
    currentStroke.push({ x: e.offsetX, y: e.offsetY });
  }
});

canvas.addEventListener("mouseup", () => {
  if (currentStroke) {
    Points.push(currentStroke);
    currentStroke = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseleave", () => {
  if (currentStroke) {
    Points.push(currentStroke);
    currentStroke = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw all strokes
  Points.forEach((stroke) => {
    if (stroke.length > 0) {
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  });
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  Points.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed")); // Trigger redraw
});
