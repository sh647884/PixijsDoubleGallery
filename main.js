import { createGalerie } from './galerie.js';

const app = new PIXI.Application();
await app.init({ width: window.innerWidth / 1.2, height: window.innerHeight });

document.body.appendChild(app.canvas);

 // lance la création de la galerie
createGalerie(app);