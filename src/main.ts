import "./style.css";

document.body.innerHTML = `
<h1 id = 'title'>Some Generic Title</h1>
`;

const canvas = document.createElement("canvas");
canvas.id = "canvas";
document.body.appendChild(canvas);
