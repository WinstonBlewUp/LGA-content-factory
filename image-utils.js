// Fonction pour créer une image composite à partir d'une collection d'URL
export async function createCompositeImage(urls) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Définir la taille de la miniature
    const thumbnailWidth = 50;
    const thumbnailHeight = 50;
    
    // Définir la taille du canvas (en fonction du nombre d'images)
    canvas.width = thumbnailWidth * urls.length;
    canvas.height = thumbnailHeight;

    // Charger et dessiner chaque image sur le canvas
    for (let i = 0; i < urls.length; i++) {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Éviter les problèmes de politique de sécurité
        img.src = urls[i];
        await new Promise(resolve => {
            img.onload = () => {
                context.drawImage(img, i * thumbnailWidth, 0, thumbnailWidth, thumbnailHeight);
                resolve();
            };
        });
    }

    // Retourner l'image combinée sous forme de Data URL
    return canvas.toDataURL();
}

// Fonction pour afficher une collection d'images (à compléter)
export function showImageCollection(recordId, columnName) {
    // Logique pour afficher la collection d'images
    console.log(`Affichage de la collection d'images pour le record ${recordId} et la colonne ${columnName}`);
}

