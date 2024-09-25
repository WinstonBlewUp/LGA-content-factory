// const outputColumns = [
//     "Article de Blog",
//     "Linkedin Post",
//     "Lead Magnet",
//     "Linkedin Visuel",
//     "Linkedin Carroussel",
//     "X-Twitter Visu",
//     "Instagram Story Cover"
// ];

// let isLoading = false;

// // Cache pour stocker les enregistrements déjà affichés
// let recordCache = {};

// function openModal(encodedContent) {
//     const modal = document.getElementById('blogModal');
//     modal.style.display = 'flex';

//     if (!window.quillInstance) {
//         window.quillInstance = new Quill('#editor-container', {
//             theme: 'snow',
//             readOnly: true,
//         });
//     }

//     const decodedContent = decodeURIComponent(encodedContent);
//     const blogContent = marked.marked(decodedContent);
//     window.quillInstance.clipboard.dangerouslyPasteHTML(blogContent);
// }

// document.getElementById('closeModal').onclick = function() {
//     closeModal();
// };

// function closeModal() {
//     const modal = document.getElementById('blogModal');
//     modal.style.display = 'none';
// }

// async function createRecordWithDefaults() {
//     const defaultContent = "";
//     const defaultAction = "";
//     await createNewRecord(defaultContent, defaultAction);
// }

// async function createNewRecord(newContent, selectedActionValue) {
//     const actionToSend = actionMapping[selectedActionValue] || null;
//     const data = {
//         fields: {
//             "Contenu de Départ": newContent || "Entrez votre Contenu",
//         }
//     };

//     if (actionToSend) {
//         data.fields["ACTIONS"] = [actionToSend];
//     }

//     try {
//         const response = await airtableRequest('POST', '', data);
//         if (response && response.fields) {
//             const newRecordId = response.id;
//             const columnType = selectedActionValue === "action3" ? "X-Twitter Visu" : null;

//             monitorColumnsContinuously(newRecordId, columnType); 
//             delete recordCache[newRecordId]; 
//             readContent(); 
//         } else {
//             alert(`Erreur lors de la création : ${response?.error?.message || 'Réponse inattendue'}`);
//         }
//     } catch (error) {
//         alert('Une erreur est survenue lors de la création du nouvel enregistrement.');
//     }
// }

// async function findRecordByCustomId(customId) {
//     const data = await airtableRequest('GET', '');
//     if (data) {
//         const record = data.records.find(record => record.fields["ID"] === parseInt(customId));
//         return record ? record.id : null;
//     }
//     return null;
// }

// async function deleteSelectedRecords() {
//     const checkboxes = document.querySelectorAll('.record-checkbox:checked');
//     if (checkboxes.length === 0) {
//         alert("Aucun enregistrement sélectionné.");
//         return;
//     }

//     for (const checkbox of checkboxes) {
//         const customId = checkbox.getAttribute('data-id');
//         console.log(`Suppression de l'enregistrement avec ID personnalisé : ${customId}`);
//         await deleteContentByCustomId(customId);
//     }

//     delete recordCache[customId]; 
//     readContent(); 
// }

// async function deleteContentByCustomId(customId) {
//     const recordId = await findRecordByCustomId(customId);
//     if (recordId) {
//         const response = await airtableRequest('DELETE', `/${recordId}`);
//         if (response) {
//             console.log(`Enregistrement avec ID ${customId} supprimé`);
//             delete recordCache[recordId]; 
//             readContent();
//         }
//     } else {
//         console.error(`Enregistrement avec ID ${customId} introuvable pour suppression`);
//     }
// }

// async function readContent() {
//     const data = await airtableRequest('GET', '');
//     //console.log("Données récupérées depuis Airtable:", data);

//     if (data) {
//         const recordsContainer = document.getElementById('records');
//         recordsContainer.innerHTML = ''; // Reset the interface

//         const sortedRecords = data.records.sort((a, b) => {
//             const dateA = new Date(a.createdTime);
//             const dateB = new Date(b.createdTime);
//             return dateB - dateA;
//         });

//         sortedRecords.forEach(record => {
//             const fields = record.fields;
//             const recordId = record.id;

//             recordCache[recordId] = fields; 

//             let div = document.createElement('div');
//             div.setAttribute('data-record-id', recordId);
//             div.classList.add('tab-line');

//             let contentInput = `<input class="button" type="text" id="prompt-${recordId}" value="${fields['Contenu de Départ'] || ''}" />`;

//             let actionSelect = `
//                 <select class="button" id="action-${recordId}">
//                     <option value="">--Choisissez l'action--</option>
//                     <option value="action1">Media to Transcription</option>
//                     <option value="action2">Article de Blog</option>
//                     <option value="action3">5X Images Twitter</option>
//                     <option value="action4">Carousel to video</option>
//                     <option value="action5">Instagram Story Cover</option>
//                     <option value="action6">2X Post Linkedin</option>
//                     <option value="action7">Carroussel Linkedin</option>
//                     <option value="action8">Lead Magnet</option>
//                 </select>`;

//             let createdAt = `<span style="color:#6B6B6B;font-size:14px">${new Date(record.createdTime).toLocaleDateString()}</span>`;

//             let statusButton = `<button id="send-button" class="button" onclick="startLoader();handleEditRecord('${recordId}', this)">Envoyer</button>`;

//             let previewLinks = '';
//             outputColumns.forEach(columnName => {
//                 const columnContent = fields[columnName];

//                 if (typeof columnContent === 'string' && columnContent.trim() !== '') {
//                     previewLinks += `<li><a href="#" onclick="openModal(&quot;${encodeURIComponent(columnContent)}&quot;)">${columnName}</a></li>`;
//                 } else if (Array.isArray(columnContent)) {
//                     const imageUrls = columnContent.filter(item => item.url && (typeof item.type === 'string' && item.type.includes('image') || item.url.endsWith('.jpg') || item.url.endsWith('.png'))).map(item => item.url);
//                     //console.log('Column Content:', columnContent);
//                     //console.log('Image URLs:', imageUrls);

//                 if ((columnName === "X-Twitter Visu" || columnName === "Linkedin Carroussel") && imageUrls.length > 1) {
//                     const imagesPerRow = columnName === "Linkedin Carroussel" ? 4 : 2;
//                     const gridTemplateColumns = `repeat(${imagesPerRow}, 1fr)`;

//                     previewLinks += `<li><div style="display: grid; grid-template-columns: ${gridTemplateColumns}; gap: 5px; max-height: 150px;">`;
//                     for (let i = 0; i < imageUrls.length; i++) {
//                         previewLinks += `<img src="${imageUrls[i]}" style="width: 100%; height: auto; object-fit: contain; cursor: pointer;" onclick="window.open('${imageUrls[i]}', '_blank')">`;
//                     }
//                     previewLinks += `</div>`;
//                     previewLinks += `</li>`;
//                 } else {
//                         columnContent.forEach(item => {
//                             if (item.url && (item.type.includes('image') || item.url.endsWith('.jpg') || item.url.endsWith('.png'))) {
//                                 previewLinks += `<li>
//                                                     <img src="${item.url}" style="width: 100px; height: auto; cursor: pointer;" onclick="window.open('${item.url}', '_blank')">
//                                                  </li>`;
//                             } else if (item.url) {
//                                 const fileName = item.filename || 'file';
//                                 previewLinks += `<li><a href="${item.url}" target="_blank">${columnName}</a></li>`;
//                             }
//                         });
//                     }
//                 }
//             });

//             if (!previewLinks) {
//                 previewLinks = '<li>Aucun contenu généré</li>';
//             }

//             let deleteCheckbox = `<input type="checkbox" class="record-checkbox" data-id="${fields["ID"]}">`;

//             div.innerHTML = `
//                 ${deleteCheckbox}
//                 <ul class="tab-line">
//                     <li> ${contentInput}</li>
//                     <li> ${actionSelect}</li>
//                     <li> ${createdAt}</li>
//                     <li> ${statusButton}</li>
//                     <li> <ul class="tab-line__links">${previewLinks}</ul></li>
//                 </ul>
//             `;
//             recordsContainer.appendChild(div);
//         });
//     }
// }



// async function handleEditRecord(recordId, buttonElement) {
//     isLoading = true;
//     console.log('isLoading mis à true');

//     // Passer la classe du bouton en warning dès le clic
//     buttonElement.classList.add('button-warning');
//     buttonElement.innerHTML = 'Modification...';

//     const prompt = document.getElementById(`prompt-${recordId}`).value;
//     const actionKey = document.getElementById(`action-${recordId}`).value;

//     if (!prompt.trim()) {
//         console.error("Le champ 'Contenu de Départ' est vide.");
//         isLoading = false;
//         return;
//     }

//     const data = {
//         fields: {
//             "Contenu de Départ": prompt
//         }
//     };

//     if (actionKey && actionMapping[actionKey]) {
//         data.fields["ACTIONS"] = [actionMapping[actionKey]];
//     } else {
//         console.error('Action invalide ou non sélectionnée');
//         isLoading = false;
//         buttonElement.classList.remove('button-warning');
//         buttonElement.innerHTML = 'Modifier';
//         return;
//     }

//     try {
//         const response = await airtableRequest('PATCH', `/${recordId}`, data);
//         if (!response || response.error) {
//             console.error('Erreur lors de la mise à jour:', response ? response.error : 'Aucune réponse reçue.');
//             isLoading = false;
//             return;
//         }

//         console.log('Modification envoyée avec succès!');
//         monitorColumnsContinuously(recordId, buttonElement);

//     } catch (error) {
//         console.error('Erreur lors de la mise à jour:', error);
//         isLoading = false;
//         buttonElement.classList.remove('button-warning');
//         buttonElement.innerHTML = 'Modifier';
//     }
// }

// async function monitorColumnsContinuously(recordId, buttonElement) {
//     isLoading = true;
//     console.log(`Démarrage de la surveillance pour l'enregistrement ${recordId}`);

//     const retryInterval = 5000;
//     const maxDuration = 10 * 60 * 1000;
//     const startTime = Date.now();

//     if (!window.monitorIntervals) {
//         window.monitorIntervals = {};
//     }

//     if (window.monitorIntervals[recordId]) {
//         clearInterval(window.monitorIntervals[recordId]);
//         console.log(`Intervalle précédent pour ${recordId} arrêté`);
//     }

//     window.monitorIntervals[recordId] = setInterval(async () => {
//         let contentFound = false;
//         console.log(`Vérification du contenu pour ${recordId}...`);

//         for (const columnName of outputColumns) {
//             const contentExists = await checkColumnForContent(recordId, columnName.trim());
//             if (contentExists) {
//                 contentFound = true;
//                 console.log(`Contenu trouvé dans la colonne: ${columnName}`);
//                 readContent();

//                 // Une fois que le contenu est apparu, on passe en classe success
//                 buttonElement.classList.remove('button-warning');
//                 buttonElement.classList.add('button-success');
//                 buttonElement.innerHTML = 'Génération réussie !';

//                 // Attendre 10 secondes avant de retirer la classe success
//                 setTimeout(() => {
//                     buttonElement.classList.remove('button-success');
//                     buttonElement.innerHTML = 'Modifier';
//                 }, 100);

//                 break;
//             }
//         }

//         if (contentFound) {
//             clearInterval(window.monitorIntervals[recordId]);
//             delete window.monitorIntervals[recordId];
//             isLoading = false;
//         } else if (Date.now() - startTime >= maxDuration) {
//             console.error('La génération a échoué ou prend trop de temps.');
//             clearInterval(window.monitorIntervals[recordId]);
//             delete window.monitorIntervals[recordId];
//             isLoading = false;
//             alert('La génération a pris trop de temps ou a échoué. Veuillez réessayer.');
//         }
//     }, retryInterval);
// }

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
let previousContentCount = {}; // Compteur pour chaque enregistrement

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

document.getElementById('closeModal').onclick = function () {
    closeModal();
};

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
            "Contenu de Départ": newContent || "Entrez votre Contenu",
        }
    };

    if (actionToSend) {
        data.fields["ACTIONS"] = [actionToSend];
    }

    try {
        const response = await airtableRequest('POST', '', data);
        if (response && response.fields) {
            const newRecordId = response.id;

            monitorColumnsContinuously(newRecordId); 
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
    if (data) {
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = ''; 

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

            let contentInput = `<input class="button" type="text" id="prompt-${recordId}" value="${fields['Contenu de Départ'] || ''}" />`;

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

    buttonElement.classList.add('button-warning');
    buttonElement.innerHTML = 'Modification...';

    const prompt = document.getElementById(`prompt-${recordId}`).value;
    const actionKey = document.getElementById(`action-${recordId}`).value;

    if (!prompt.trim()) {
        console.error("Le champ 'Contenu de Départ' est vide.");
        isLoading = false;
        return;
    }

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
        buttonElement.classList.remove('button-warning');
        buttonElement.innerHTML = 'Modifier';
        return;
    }

    try {
        const response = await airtableRequest('PATCH', `/${recordId}`, data);
        if (!response || response.error) {
            console.error('Erreur lors de la mise à jour:', response ? response.error : 'Aucune réponse reçue.');
            isLoading = false;
            return;
        }

        console.log('Modification envoyée avec succès!');
        monitorColumnsContinuously(recordId, buttonElement);

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        isLoading = false;
        buttonElement.classList.remove('button-warning');
        buttonElement.innerHTML = 'Modifier';
    }
}

async function monitorColumnsContinuously(recordId, buttonElement) {
    isLoading = true;
    console.log(`Démarrage de la surveillance pour l'enregistrement ${recordId}`);

    const retryInterval = 5000;
    const maxDuration = 10 * 60 * 1000;
    const startTime = Date.now();

    if (!window.monitorIntervals) {
        window.monitorIntervals = {};
    }

    if (window.monitorIntervals[recordId]) {
        clearInterval(window.monitorIntervals[recordId]);
        console.log(`Intervalle précédent pour ${recordId} arrêté`);
    }

    // Initialiser le compteur initial
    const initialContentCount = await countExistingContents(recordId);

    window.monitorIntervals[recordId] = setInterval(async () => {
        console.log(`Vérification du contenu pour ${recordId}...`);

        // Comparer le nombre de contenus actuels avec le nombre initial
        const currentContentCount = await countExistingContents(recordId);

        if (currentContentCount > initialContentCount) {
            console.log(`Nouveau contenu détecté pour ${recordId}`);
            readContent();

            buttonElement.classList.remove('button-warning');
            buttonElement.classList.add('button-success');
            buttonElement.innerHTML = 'Génération réussie !';

            setTimeout(() => {
                buttonElement.classList.remove('button-success');
                buttonElement.innerHTML = 'Modifier';
            }, 10000); // Attendre 10 secondes avant de retirer la classe success

            clearInterval(window.monitorIntervals[recordId]);
            delete window.monitorIntervals[recordId];
            isLoading = false;
        } else if (Date.now() - startTime >= maxDuration) {
            console.error('La génération a échoué ou prend trop de temps.');
            clearInterval(window.monitorIntervals[recordId]);
            delete window.monitorIntervals[recordId];
            isLoading = false;
            alert('La génération a pris trop de temps ou a échoué. Veuillez réessayer.');
        }
    }, retryInterval);
}

async function countExistingContents(recordId) {
    try {
        const recordData = await airtableRequest('GET', `/${recordId}`);
        let count = 0;

        if (recordData.fields) {
            outputColumns.forEach(columnName => {
                const columnContent = recordData.fields[columnName];
                if (columnContent && (typeof columnContent === 'string' && columnContent.trim() !== '' || Array.isArray(columnContent) && columnContent.length > 0)) {
                    count++;
                }
            });
        }
        return count;
    } catch (error) {
        console.error("Erreur lors du comptage des contenus existants:", error);
        return 0;
    }
}

