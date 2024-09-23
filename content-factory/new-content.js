const outputColumns = [
    "Article de Blog",
    "Linkedin Post",
    "Lead Magnet",
    "Linkedin Visuel",
    "Linkedin Carroussel",
    "X-Twitter Visu",
    "Instagram Story Cover"
];

let isLoading = false;

// Cache pour stocker les enregistrements déjà affichés
let recordCache = {};

function openModal(encodedContent) {
    const modal = document.getElementById('blogModal');
    modal.style.display = 'flex';

    if (!window.quillInstance) {
        window.quillInstance = new Quill('#editor-container', {
            theme: 'snow',
            readOnly: true,
        });
    }

    const decodedContent = decodeURIComponent(encodedContent);
    const blogContent = marked.marked(decodedContent);
    window.quillInstance.clipboard.dangerouslyPasteHTML(blogContent);
}

function closeModal() {
    const modal = document.getElementById('blogModal');
    modal.style.display = 'none';
}

async function createRecordWithDefaults() {
    const defaultContent = "";
    const defaultAction = "";
    await createNewRecord(defaultContent, defaultAction);
}

async function createNewRecord(newContent, selectedActionValue) {
    const actionToSend = actionMapping[selectedActionValue] || null;
    const data = {
        fields: {
            "Contenu de Départ": newContent || "Contenu par défaut",
        }
    };

    if (actionToSend) {
        data.fields["ACTIONS"] = [actionToSend];
    }

    try {
        const response = await airtableRequest('POST', '', data);
        if (response && response.fields) {
            const newRecordId = response.id;
            const columnType = selectedActionValue === "action3" ? "X-Twitter Visu" : null;

            monitorColumnsContinuously(newRecordId, columnType); 
            delete recordCache[newRecordId]; 
            readContent(); 
        } else {
            alert(`Erreur lors de la création : ${response?.error?.message || 'Réponse inattendue'}`);
        }
    } catch (error) {
        alert('Une erreur est survenue lors de la création du nouvel enregistrement.');
    }
}

async function findRecordByCustomId(customId) {
    const data = await airtableRequest('GET', '');
    if (data) {
        const record = data.records.find(record => record.fields["ID"] === parseInt(customId));
        return record ? record.id : null;
    }
    return null;
}

async function deleteSelectedRecords() {
    const checkboxes = document.querySelectorAll('.record-checkbox:checked');
    if (checkboxes.length === 0) {
        alert("Aucun enregistrement sélectionné.");
        return;
    }

    for (const checkbox of checkboxes) {
        const customId = checkbox.getAttribute('data-id');
        console.log(`Suppression de l'enregistrement avec ID personnalisé : ${customId}`);
        await deleteContentByCustomId(customId);
    }

    delete recordCache[customId]; 
    readContent(); 
}

async function deleteContentByCustomId(customId) {
    const recordId = await findRecordByCustomId(customId);
    if (recordId) {
        const response = await airtableRequest('DELETE', `/${recordId}`);
        if (response) {
            console.log(`Enregistrement avec ID ${customId} supprimé`);
            delete recordCache[recordId]; 
            readContent();
        }
    } else {
        console.error(`Enregistrement avec ID ${customId} introuvable pour suppression`);
    }
}

async function readContent() {
    const data = await airtableRequest('GET', '');
    //console.log("Données récupérées depuis Airtable:", data);

    if (data) {
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = ''; // Reset the interface

        const sortedRecords = data.records.sort((a, b) => {
            const dateA = new Date(a.createdTime);
            const dateB = new Date(b.createdTime);
            return dateB - dateA;
        });

        sortedRecords.forEach(record => {
            const fields = record.fields;
            const recordId = record.id;

            recordCache[recordId] = fields; 

            let div = document.createElement('div');
            div.setAttribute('data-record-id', recordId);
            div.classList.add('tab-line');

            let contentInput = `<input style="all:unset;"type="text" id="prompt-${recordId}" value="${fields['Contenu de Départ'] || ''}" />`;

            let actionSelect = `
                <select class="button" id="action-${recordId}">
                    <option value="">--Choisissez l'action--</option>
                    <option value="action1">Media to Transcription</option>
                    <option value="action2">Article de Blog</option>
                    <option value="action3">5X Images Twitter</option>
                    <option value="action4">Carousel to video</option>
                    <option value="action5">Instagram Story Cover</option>
                    <option value="action6">2X Post Linkedin</option>
                    <option value="action7">Carroussel Linkedin</option>
                    <option value="action8">Lead Magnet</option>
                </select>`;

            let createdAt = `<span style="color:#6B6B6B;font-size:14px">${new Date(record.createdTime).toLocaleDateString()}</span>`;

            let statusButton = `<button id="send-button" class="button" onclick="startLoader();handleEditRecord('${recordId}', this)">Envoyer</button>`;

            let previewLinks = '';
            outputColumns.forEach(columnName => {
                const columnContent = fields[columnName];

                if (typeof columnContent === 'string' && columnContent.trim() !== '') {
                    previewLinks += `<li><a href="#" onclick="openModal(&quot;${encodeURIComponent(columnContent)}&quot;)">${columnName}</a></li>`;
                } else if (Array.isArray(columnContent)) {
                    const imageUrls = columnContent.filter(item => item.url && (typeof item.type === 'string' && item.type.includes('image') || item.url.endsWith('.jpg') || item.url.endsWith('.png'))).map(item => item.url);
                    //console.log('Column Content:', columnContent);
                    //console.log('Image URLs:', imageUrls);

                if ((columnName === "X-Twitter Visu" || columnName === "Linkedin Carroussel") && imageUrls.length > 1) {
                    const imagesPerRow = columnName === "Linkedin Carroussel" ? 4 : 2;
                    const gridTemplateColumns = `repeat(${imagesPerRow}, 1fr)`;

                    previewLinks += `<li><div style="display: grid; grid-template-columns: ${gridTemplateColumns}; gap: 5px; max-height: 150px;">`;
                    for (let i = 0; i < imageUrls.length; i++) {
                        previewLinks += `<img src="${imageUrls[i]}" style="width: 100%; height: auto; object-fit: contain; cursor: pointer;" onclick="window.open('${imageUrls[i]}', '_blank')">`;
                    }
                    previewLinks += `</div>`;
                    previewLinks += `</li>`;
                } else {
                        columnContent.forEach(item => {
                            if (item.url && (item.type.includes('image') || item.url.endsWith('.jpg') || item.url.endsWith('.png'))) {
                                previewLinks += `<li>
                                                    <img src="${item.url}" style="width: 100px; height: auto; cursor: pointer;" onclick="window.open('${item.url}', '_blank')">
                                                 </li>`;
                            } else if (item.url) {
                                const fileName = item.filename || 'file';
                                previewLinks += `<li><a href="${item.url}" target="_blank">${columnName}</a></li>`;
                            }
                        });
                    }
                }
            });

            if (!previewLinks) {
                previewLinks = '<li>Aucun contenu généré</li>';
            }

            let deleteCheckbox = `<input type="checkbox" class="record-checkbox" data-id="${fields["ID"]}">`;

            div.innerHTML = `
                ${deleteCheckbox}
                <ul class="tab-line">
                    <li> ${contentInput}</li>
                    <li> ${actionSelect}</li>
                    <li> ${createdAt}</li>
                    <li> ${statusButton}</li>
                    <li> <ul class="tab-line__links">${previewLinks}</ul></li>
                </ul>
            `;
            recordsContainer.appendChild(div);
        });
    }
}



async function handleEditRecord(recordId, buttonElement) {
    isLoading = true;
    console.log('isLoading mis à true');
    startLoader();

    const prompt = document.getElementById(`prompt-${recordId}`).value;
    const actionKey = document.getElementById(`action-${recordId}`).value;

    if (!prompt.trim()) {
        console.error("Le champ 'Contenu de Départ' est vide.");
        isLoading = false;
        return;
    }

    buttonElement.innerHTML = 'En attente...';

    const data = {
        fields: {
            "Contenu de Départ": prompt
        }
    };

    if (actionKey && actionMapping[actionKey]) {
        data.fields["ACTIONS"] = [actionMapping[actionKey]];
    } else {
        console.error('Action invalide ou non sélectionnée');
        isLoading = false;
        buttonElement.innerHTML = 'Modifier';
        return;
    }

    //console.log('Données envoyées à Airtable:', data);

    try {
        const response = await airtableRequest('PATCH', `/${recordId}`, data);
        if (!response || response.error) {
            console.error('Erreur lors de la mise à jour:', response ? response.error : 'Aucune réponse reçue.');
            isLoading = false;
            return;
        }
        console.log('Modification envoyée avec succès!');
        monitorColumnsContinuously(recordId); // Redémarrer la surveillance ici
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        isLoading = false;
    }

    buttonElement.innerHTML = 'Modifier';
}

// async function monitorColumnsContinuously(recordId) {
//     isLoading = true; // Démarrage de la surveillance
//     const retryInterval = 5000; // Intervalle entre chaque tentative en millisecondes
//     const maxDuration = 10 * 60 * 1000; // Durée maximale de 10 minutes (par exemple)
//     const startTime = Date.now();

//     // Assurez-vous qu'il n'y a pas déjà un intervalle en cours pour ce record
//     if (window.monitorInterval) {
//         clearInterval(window.monitorInterval);
//     }

//     window.monitorInterval = setInterval(async () => {
//         let contentFound = false;
//         for (const columnName of outputColumns) {
//             const contentExists = await checkColumnForContent(recordId, columnName.trim());
//             if (contentExists) {
//                 contentFound = true;
//                 readContent(); // Appel de la fonction pour afficher le contenu


//                 isLoading = false;
//                 console.log('isLoading mis à false (succès)');
//                 break;
//             }
//         }

//         if (contentFound) {
//             clearInterval(window.monitorInterval);
//         } else if (Date.now() - startTime >= maxDuration) {
//             console.error('La génération a échoué ou prend trop de temps.');
//             clearInterval(window.monitorInterval);
//             isLoading = false;
//             alert('La génération a pris trop de temps ou a échoué. Veuillez réessayer.');
//         }
//     }, retryInterval);
// }

async function monitorColumnsContinuously(recordId) {
    isLoading = true;
    console.log(`Démarrage de la surveillance pour l'enregistrement ${recordId}`);
    
    const retryInterval = 5000; // Intervalle entre chaque tentative en millisecondes
    const maxDuration = 10 * 60 * 1000; // Durée maximale de 10 minutes
    const startTime = Date.now();

    // Utilisation d'un objet pour suivre les intervalles par enregistrement
    if (!window.monitorIntervals) {
        window.monitorIntervals = {};
    }

    // Si un intervalle existe déjà pour cet enregistrement, on l'arrête
    if (window.monitorIntervals[recordId]) {
        clearInterval(window.monitorIntervals[recordId]);
        console.log(`Intervalle précédent pour ${recordId} arrêté`);
    }

    // Démarrage d'un nouvel intervalle pour cet enregistrement
    window.monitorIntervals[recordId] = setInterval(async () => {
        let contentFound = false;
        console.log(`Vérification du contenu pour ${recordId}...`);
        
        // Parcourt des colonnes de sortie pour vérifier si le contenu est généré
        for (const columnName of outputColumns) {
            const contentExists = await checkColumnForContent(recordId, columnName.trim());
            if (contentExists) {
                contentFound = true;
                console.log(`Contenu trouvé dans la colonne: ${columnName}`);
                readContent(); // Affiche le contenu
                break;
            }
        }

        if (contentFound) {
            // Le contenu est trouvé et affiché, on arrête l'intervalle
            clearInterval(window.monitorIntervals[recordId]);
            delete window.monitorIntervals[recordId]; // Nettoyage après l'arrêt
            isLoading = false;
            console.log('isLoading mis à false (succès), contenu affiché');
        } else if (Date.now() - startTime >= maxDuration) {
            // Si la génération prend trop de temps, on arrête la surveillance
            console.error('La génération a échoué ou prend trop de temps.');
            clearInterval(window.monitorIntervals[recordId]);
            delete window.monitorIntervals[recordId];
            isLoading = false;
            alert('La génération a pris trop de temps ou a échoué. Veuillez réessayer.');
        } else {
            // Continuer de surveiller tant que la durée maximale n'est pas atteinte
            console.log(`Tentative de vérification du contenu pour ${recordId}... isLoading: ${isLoading}`);
        }
    }, retryInterval);
}




// async function checkColumnForContent(recordId, columnName) {
//     try {
//         const recordData = await airtableRequest('GET', `/${recordId}`);
//         if (recordData.fields && recordData.fields[columnName]) {
//             const columnContent = recordData.fields[columnName];
//             if (Array.isArray(columnContent) && columnContent.length > 0) {
//                 return true;
//             }
//             if (typeof columnContent === 'string' && columnContent.trim() !== '') {
//                 return true;
//             }
//             return false;
//         } else {
//             return false;
//         }
//     } catch (error) {
//         console.error("Erreur lors de la vérification de la colonne:", error);
//         return false;
//     }
// }

async function checkColumnForContent(recordId, columnName) {
    try {
        const recordData = await airtableRequest('GET', `/${recordId}`);
        
        if (recordData.fields && recordData.fields[columnName]) {
            const columnContent = recordData.fields[columnName];

            // Vérifier s'il s'agit d'un contenu récent
            const createdTime = new Date(recordData.createdTime).getTime();
            const currentTime = new Date().getTime();

            // Ajout d'une marge de temps pour considérer le contenu comme récent
            const timeDifference = currentTime - createdTime;

            // Supposons que tout contenu généré dans les 2 dernières minutes est "nouveau"
            const timeLimit = 2 * 60 * 1000;

            if (Array.isArray(columnContent) && columnContent.length > 0 && timeDifference <= timeLimit) {
                return true;
            }
            if (typeof columnContent === 'string' && columnContent.trim() !== '' && timeDifference <= timeLimit) {
                return true;
            }
            return false;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Erreur lors de la vérification de la colonne:", error);
        return false;
    }
}
