// Fonction pour convertir les minutes en format HH:MM
function convertMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60); // Calculer les heures
    const mins = minutes % 60; // Récupérer les minutes restantes
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`; // Format HH:MM
}

export async function createGalerie(app) {
    const response = await fetch('./assets/photos.json');
    const data = await response.json();
    const photos = data.photos;

    const assetsToLoad = photos.map(photo => `./assets/${photo.fileName}`);
    await PIXI.Assets.load(assetsToLoad);

    let currentIndex = 0;

    function displayPhotos() {
        app.stage.removeChildren();

        const canvasWidth = window.innerWidth * 0.8;
        const canvasHeight = window.innerHeight;
        const nbStrips = 12;
        const stripWidth = (canvasWidth / 2) / nbStrips;
        const imageWidth = canvasWidth / 2;
        const imageHeight = canvasHeight;

        const currentPhotos = [photos[currentIndex], photos[currentIndex + 1]];

        currentPhotos.forEach((photo, index) => {
            const texture = PIXI.Texture.from(`./assets/${photo.fileName}`);
            const offsetX = index === 0 ? 0 : imageWidth;
            const container = new PIXI.Container();
            container.x = offsetX;

            const aspectRatio = texture.width / texture.height;
            const scaledHeight = imageHeight;
            const scaledWidth = imageHeight * aspectRatio;

            const sprite = new PIXI.Sprite(texture);
            sprite.height = scaledHeight;
            sprite.width = scaledWidth;
            sprite.x = (imageWidth - scaledWidth) / 2;

            container.addChild(sprite);

            const mask = new PIXI.Graphics();
            mask.beginFill(0xFFFFFF);
            mask.drawRect(0, 0, imageWidth, imageHeight);
            mask.endFill();
            container.addChild(mask);
            container.mask = mask;

            const strips = [];

            for (let i = 0; i < nbStrips; i++) {
                const stripMask = new PIXI.Graphics();
                stripMask.beginFill(0xFFFFFF);
                stripMask.drawRect(i * stripWidth, 0, stripWidth, imageHeight);
                stripMask.endFill();
            
                const stripContainer = new PIXI.Container();
                const stripSprite = new PIXI.Sprite(texture);
            
                stripSprite.width = scaledWidth;
                stripSprite.height = scaledHeight;
                stripSprite.x = 0;
                stripSprite.y = 0;
            
                stripSprite.interactive = true;
                stripSprite.buttonMode = true;
            
                let isDragging = false;
                let isHovered = false;
                let startY = 0;
                let readyToScroll = false;  // Nouvelle variable pour indiquer si le défilement est prêt
            
                strips.push(stripSprite);

                stripSprite.on('mouseover', () => {
                    isHovered = true;
                    applyHoverEffect(i); // Appliquer effet hover
                });

                stripSprite.on('mouseout', () => {
                    isHovered = false;
                    resetHoverEffect(); // Réinitialiser l'effet hover
                });
            
                stripSprite.on('mousedown', (event) => {
                    isDragging = true;
                    startY = event.data.global.y - stripSprite.y;
                    readyToScroll = false;  // Réinitialiser à chaque clic
                    document.body.style.cursor = 'grabbing';
                });
            
                stripSprite.on('mousemove', (event) => {
                    if (isDragging) {
                        const deltaY = event.data.global.y - startY;
            
                        // Appliquer le delta à toutes les bandes avec un effet de progression
                        strips.forEach((strip, index) => {
                            const distance = Math.abs(i - index);  // Calculer la distance avec la bande tirée
                            const factor = Math.max(1 - (distance / 10), 0);  // Diminuer l'effet avec la distance
            
                            // Plus on est loin de la bande principale, plus le mouvement est réduit
                            strip.y = deltaY * factor;
                        });
            
                        // Marquer si on est prêt à passer à la prochaine photo
                        if (deltaY < -250) {
                            readyToScroll = true;  // Prêt à défiler si la limite de -250 pixels est atteinte
                        }
                    }
                });
            
                stripSprite.on('mouseup', () => {
                    if (isDragging && readyToScroll) {
                        moveToNextPhotos();  // Défilement de la photo si la limite est atteinte et que le clic est relâché
                    }
                    isDragging = false;
                    document.body.style.cursor = 'default';
                });
            
                stripSprite.on('mouseupoutside', () => {
                    if (isDragging && readyToScroll) {
                        moveToNextPhotos();  // cas où la souris est relâchée en dehors du sprite
                    }
                    isDragging = false;
                    document.body.style.cursor = 'default';
                });
            
                stripContainer.addChild(stripSprite);
                stripContainer.mask = stripMask;
                stripContainer.addChild(stripMask);
            
                container.addChild(stripContainer);
            }

            // Effet hover
            function applyHoverEffect(hoverIndex) {
                strips.forEach((strip, index) => {
                    const distance = Math.abs(index - hoverIndex);
                    if (distance === 0) {
                        strip.y = Math.max(strip.y - 20, -20); // Effet fort pour la bande survolée
                    } else if (distance === 1) {
                        strip.y = Math.max(strip.y - 10, -10); // moyen pour les bandes voisines
                    } else if (distance === 2) {
                        strip.y = Math.max(strip.y - 5, -5);  // et faible les plus éloignées
                }});
            }

            // Réinitialiser l'effet hover
            function resetHoverEffect() {
                strips.forEach(strip => {
                    strip.y = 0; // Toutes les bandes reviennent à leur position initiale
                });
            }

            const timeStyle = new PIXI.TextStyle({
                fontFamily: 'MontrealTS-Bold',
                fontSize: 48,
                fill: '#ffffff',
                align: 'center',
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 5,
                dropShadowDistance: 5,
            });

            const locationStyle = new PIXI.TextStyle({
                fontFamily: 'MontrealTS-Light',
                fontSize: 32,
                fill: '#ffffff',
                align: 'center',
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 5,
                dropShadowDistance: 5,
            });

            const formattedTime = convertMinutesToTime(photo.time);
            const timeText = new PIXI.Text(formattedTime, timeStyle);
            const locationText = new PIXI.Text(`${photo.location}, ${photo.country}`, locationStyle);

            timeText.x = offsetX + (imageWidth - timeText.width) / 2;
            timeText.y = (imageHeight / 2) - timeText.height;

            locationText.x = offsetX + (imageWidth - locationText.width) / 2;
            locationText.y = timeText.y + timeText.height + 10;

            app.stage.addChild(container);
            app.stage.addChild(timeText);
            app.stage.addChild(locationText);
        });

        app.renderer.resize(canvasWidth, canvasHeight);
    }

    function moveToNextPhotos() {
        currentIndex += 2;
        if (currentIndex >= photos.length) {
            currentIndex = 0;
        }
        displayPhotos();
    }

    function moveToPreviousPhotos() {
        currentIndex -= 2;
        if (currentIndex < 0) {
            currentIndex = photos.length - 2;
        }
        displayPhotos();
    }

    // Ajout de l'écouteur pour la roulette de la souris
    window.addEventListener('wheel', (event) => {
        if (event.deltaY < 0) {
            // Scroll vers le haut, on passe à la photo précédente
            moveToPreviousPhotos();
        } else if (event.deltaY > 0) {
            // Scroll vers le bas, on passe à la photo suivante
            moveToNextPhotos();
        }
    });

    displayPhotos();
}
