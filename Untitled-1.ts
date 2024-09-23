/*const outputColumns = [
    "Article de Blog",
    "Linkedin Post",
    "Linkedin Visuel",
    "Linkedin Carroussel",
    "X-Twitter Visu",
    "Instagram Story Cover",
    "Lead Magnet"
];

function openModal(content) {
    const modal = document.getElementById('blogModal');
    modal.style.display = 'flex';

    // Initialiser Quill si ce n'est pas déjà fait
    if (!window.quillInstance) {
        window.quillInstance = new Quill('#editor-container', {
            theme: 'snow',  // Thème de Quill
            readOnly: true,  // Mettre l'éditeur en lecture seule pour l'affichage
        });
    }

    // Insérer le contenu dans Quill
    const blogContent = marked.marked(content);  // Convertir le Markdown en HTML
    window.quillInstance.clipboard.dangerouslyPasteHTML(blogContent);  // Insérer le contenu HTML dans Quill
}

// Fonction pour fermer le modal
function closeModal() {
    const modal = document.getElementById('blogModal');
    modal.style.display = 'none';
}


async function createRecordWithDefaults() {
    const defaultContent = "";
    const defaultAction = "";
    await createNewRecord(defaultContent, defaultAction);
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

    readContent();
}

async function deleteContentByCustomId(customId) {
    const recordId = await findRecordByCustomId(customId);
    if (recordId) {
        const response = await airtableRequest('DELETE', `/${recordId}`);
        if (response) {
            console.log(`Enregistrement avec ID ${customId} supprimé`);
            readContent(); 
        }
    } else {
        console.error(`Enregistrement avec ID ${customId} introuvable pour suppression`);
    }
}

let recordCache = {};

async function readContent() {
    const data = await airtableRequest('GET', '');
    console.log("Données récupérées depuis Airtable:", data);

    if (data) {
        const recordsContainer = document.getElementById('records');

        // Convertir les enregistrements en tableau et les trier par un champ comme 'ID personnalisé' ou 'ID Airtable'
        const sortedRecords = data.records.sort((a, b) => {
            // Assurer que les ID sont des chaînes de caractères avant d'utiliser localeCompare
            const idA = String(a.fields["ID"] || ''); // Convertir en chaîne de caractères
            const idB = String(b.fields["ID"] || ''); // Convertir en chaîne de caractères
            return idA.localeCompare(idB);
        });

        // Garder une trace des enregistrements déjà existants dans le DOM
        const existingRecords = Array.from(recordsContainer.children).reduce((acc, div) => {
            const recordId = div.getAttribute('data-record-id');
            if (recordId) acc[recordId] = div;
            return acc;
        }, {});

        // Mettre à jour ou ajouter les enregistrements dans le conteneur
        sortedRecords.forEach(record => {
            const fields = record.fields;
            const recordId = record.id;

            let div = existingRecords[recordId];
            if (!div) {
                // Créer un nouveau div s'il n'existe pas déjà
                div = document.createElement('div');
                div.setAttribute('data-record-id', recordId);
                recordsContainer.appendChild(div);
            }

            let outputLinks = '';

            for (const [fieldName, fieldValue] of Object.entries(fields)) {
                const trimmedFieldName = fieldName.trim();

                if (trimmedFieldName === "Article de Blog" && typeof fieldValue === 'string') {
                    const blogContent = marked.marked(fieldValue);  // marked est maintenant globalement accessible
                    outputLinks += `
                        <li>
                            <strong>${trimmedFieldName}:</strong>
                            <div>${blogContent}</div>
                        </li>`;
                }
                 else if (Array.isArray(fieldValue)) {
                    fieldValue.forEach(item => {
                        if (item.url) {
                            const fileName = item.filename || 'file';
                            outputLinks += `<li><strong>${trimmedFieldName}:</strong>
                                            <a href="${item.url}" target="_blank">Prévisualiser</a> |
                                            <a href="#" onclick="downloadFile('${item.url}', '${fileName}')">Télécharger</a>
                                            </li>`;
                        }
                    });
                } else if (typeof fieldValue === 'string' && fieldValue.startsWith('http')) {
                    outputLinks += `<li><strong>${trimmedFieldName}:</strong> <a href="${fieldValue}" target="_blank">Voir</a></li>`;
                }
            }

            if (!outputLinks) {
                outputLinks = '<li>Aucun contenu généré</li>';
            }

            const recordHtml = `
                <input type="checkbox" class="record-checkbox" data-id="${record.fields["ID"]}">
                <strong>ID Airtable: ${recordId}</strong><br>
                <ul>
                    <li><strong>ID personnalisé:</strong> ${fields["ID"] || 'Non défini'}</li>
                    <li><strong>Contenu de Départ:</strong> ${fields["Contenu de Départ"] || 'Vide'}</li>
                    <li><strong>ACTIONS:</strong> ${fields["ACTIONS"] ? JSON.stringify(fields["ACTIONS"]) : 'Non défini'}</li>
                    ${outputLinks}
                </ul>
                <hr>
            `;

            // Mise à jour du contenu du div uniquement si nécessaire
            if (div.innerHTML !== recordHtml) {
                div.innerHTML = recordHtml;
            }
        });

        // Supprimer les divs qui ne sont plus dans les enregistrements
        Object.keys(existingRecords).forEach(recordId => {
            if (!sortedRecords.find(record => record.id === recordId)) {
                recordsContainer.removeChild(existingRecords[recordId]);
            }
        });
    }
}


// Modification de la surveillance continue pour rafraîchir l'interface à chaque détection
async function monitorColumnsContinuously(recordId, columnType = null) {
    const retryInterval = 5000; // 5 secondes entre chaque vérification
    let attempts = 0;

    // Ajuster le nombre de tentatives en fonction du type de contenu
    const maxAttempts = columnType === "X-Twitter Visu" ? 30 : 12; // Plus de tentatives pour les contenus longs

    const interval = setInterval(async () => {
        let contentFound = false;

        for (const columnName of outputColumns) {
            const contentExists = await checkColumnForContent(recordId, columnName.trim());
            if (contentExists) {
                console.log(`Contenu détecté pour l'enregistrement ${recordId}, colonne: ${columnName}`);
                contentFound = true;
                readContent(); // Recharge l'interface dès qu'un contenu est trouvé
            }
        }

        if (contentFound) {
            attempts = 0; // Réinitialiser le compteur de tentatives pour permettre la détection des autres contenus
        } else if (attempts >= maxAttempts) {
            console.log(`Aucun contenu trouvé après ${maxAttempts} tentatives.`);
            clearInterval(interval); // Arrête la surveillance après plusieurs tentatives infructueuses
        } else {
            attempts++;
            console.log(`Tentative ${attempts} - Aucun contenu trouvé pour l'enregistrement ${recordId}.`);
        }
    }, retryInterval);
}

async function checkColumnForContent(recordId, columnName) {
    try {
        const recordData = await airtableRequest('GET', `/${recordId}`);
        if (recordData.fields && recordData.fields[columnName]) {
            const columnContent = recordData.fields[columnName];

            // Vérification pour les fichiers PDF ou autres URL
            if (Array.isArray(columnContent) && columnContent.length > 0) {
                for (const item of columnContent) {
                    if (item.type === 'application/pdf' || item.url) {
                        return true;
                    }
                }
            }

            // Vérification si le contenu est du texte non vide
            if (typeof columnContent === 'string' && columnContent.trim() !== '') {
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

function downloadFile(url, fileName) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const urlBlob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlBlob;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(urlBlob);
        })
        .catch(err => console.error('Erreur lors du téléchargement du fichier:', err));
}

async function findRecordByCustomId(customId) {
    const data = await airtableRequest('GET', '');
    if (data) {
        const record = data.records.find(record => record.fields["ID"] === parseInt(customId));
        return record ? record.id : null;
    }
    return null;
}

async function createNewRecord(newContent, selectedActionValue) {
    const actionToSend = actionMapping[selectedActionValue] || null;
    const data = {
        fields: {
            "Contenu de Départ": newContent || "...",
        }
    };

    if (actionToSend) {
        data.fields["ACTIONS"] = [actionToSend];
    }

    try {
        const response = await airtableRequest('POST', '', data);
        if (response && response.fields) {
            const newRecordId = response.id;
            const columnType = selectedActionValue === "action3" ? "X-Twitter Visu" : null; // Exemple pour les contenus longs

            readContent(); // Recharge l'interface
            monitorColumnsContinuously(newRecordId, columnType);  // Surveillance continue pour ce nouvel enregistrement
        } else {
            alert(`Erreur lors de la création: ${response?.error?.message || 'Réponse inattendue'}`);
        }
    } catch (error) {
        alert('Une erreur est survenue lors de la création du nouvel enregistrement.');
    }
}

async function updateContentByCustomId(customId, newContent) {
    const recordId = await findRecordByCustomId(customId);
    if (recordId) {
        await updateContent(recordId, newContent);
    } else {
        console.error(`Enregistrement avec ID ${customId} introuvable`);
    }
}

async function updateContent(recordId, newContent) {
    const data = {
        fields: {
            "Contenu de Départ": newContent
        }
    };
    const response = await airtableRequest('PATCH', `/${recordId}`, data);
    if (response && response.fields) {
        readContent();
        monitorColumnsContinuously(recordId);  // Surveillance continue après la mise à jour
    }
}
*/

const outputColumns = [
    "Article de Blog",
    "Linkedin Post",
    "Linkedin Visuel",
    "Linkedin Carroussel",
    "X-Twitter Visu",
    "Instagram Story Cover",
    "Lead Magnet"
];

function openModal(encodedContent) {
    const modal = document.getElementById('blogModal');
    modal.style.display = 'flex';

    // Initialiser Quill si ce n'est pas déjà fait
    if (!window.quillInstance) {
        window.quillInstance = new Quill('#editor-container', {
            theme: 'snow',  // Thème de Quill
            readOnly: true,  // Mettre l'éditeur en lecture seule pour l'affichage
        });
    }

    // Décoder le contenu encodé
    const decodedContent = decodeURIComponent(encodedContent);

    // Insérer le contenu dans Quill
    const blogContent = marked.marked(decodedContent);  // Convertir le Markdown en HTML
    window.quillInstance.clipboard.dangerouslyPasteHTML(blogContent);  // Insérer le contenu HTML dans Quill
}

// Fonction pour fermer le modal
function closeModal() {
    const modal = document.getElementById('blogModal');
    modal.style.display = 'none';
}

async function createRecordWithDefaults() {
    const defaultContent = "";
    const defaultAction = "";
    await createNewRecord(defaultContent, defaultAction);
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

    readContent();
}

async function deleteContentByCustomId(customId) {
    const recordId = await findRecordByCustomId(customId);
    if (recordId) {
        const response = await airtableRequest('DELETE', `/${recordId}`);
        if (response) {
            console.log(`Enregistrement avec ID ${customId} supprimé`);
            readContent(); 
        }
    } else {
        console.error(`Enregistrement avec ID ${customId} introuvable pour suppression`);
    }
}

let recordCache = {};

async function readContent() {
    const data = await airtableRequest('GET', '');
    console.log("Données récupérées depuis Airtable:", data);

    if (data) {
        const recordsContainer = document.getElementById('records');

        // Convertir les enregistrements en tableau et les trier par un champ comme 'ID personnalisé' ou 'ID Airtable'
        const sortedRecords = data.records.sort((a, b) => {
            const idA = String(a.fields["ID"] || ''); 
            const idB = String(b.fields["ID"] || ''); 
            return idA.localeCompare(idB);
        });

        // Garder une trace des enregistrements déjà existants dans le DOM
        const existingRecords = Array.from(recordsContainer.children).reduce((acc, div) => {
            const recordId = div.getAttribute('data-record-id');
            if (recordId) acc[recordId] = div;
            return acc;
        }, {});

        // Mettre à jour ou ajouter les enregistrements dans le conteneur
        sortedRecords.forEach(record => {
            const fields = record.fields;
            const recordId = record.id;

            let div = existingRecords[recordId];
            if (!div) {
                div = document.createElement('div');
                div.setAttribute('data-record-id', recordId);
                recordsContainer.appendChild(div);
            }

            let outputLinks = '';

            for (const [fieldName, fieldValue] of Object.entries(fields)) {
                const trimmedFieldName = fieldName.trim();

                if (trimmedFieldName === "Article de Blog" && typeof fieldValue === 'string') {
                    outputLinks += `
                        <li>
                            <strong>${trimmedFieldName}:</strong>
                            <button onclick="openModal(&quot;${encodeURIComponent(fieldValue)}&quot;)">Voir plus</button>
                        </li>`;

                }
                else if (Array.isArray(fieldValue)) {
                    fieldValue.forEach(item => {
                        if (item.url) {
                            const fileName = item.filename || 'file';
                            outputLinks += `<li><strong>${trimmedFieldName}:</strong>
                                            <a href="${item.url}" target="_blank">Prévisualiser</a> |
                                            <a href="#" onclick="downloadFile('${item.url}', '${fileName}')">Télécharger</a>
                                            </li>`;
                        }
                    });
                } else if (typeof fieldValue === 'string' && fieldValue.startsWith('http')) {
                    outputLinks += `<li><strong>${trimmedFieldName}:</strong> <a href="${fieldValue}" target="_blank">Voir</a></li>`;
                }
            }

            if (!outputLinks) {
                outputLinks = '<li>Aucun contenu généré</li>';
            }

            const recordHtml = `
                <input type="checkbox" class="record-checkbox" data-id="${record.fields["ID"]}">
                <strong>ID Airtable: ${recordId}</strong><br>
                <ul>
                    <li><strong>ID personnalisé:</strong> ${fields["ID"] || 'Non défini'}</li>
                    <li><strong>Contenu de Départ:</strong> ${fields["Contenu de Départ"] || 'Vide'}</li>
                    <li><strong>ACTIONS:</strong> ${fields["ACTIONS"] ? JSON.stringify(fields["ACTIONS"]) : 'Non défini'}</li>
                    ${outputLinks}
                </ul>
                <hr>
            `;

            if (div.innerHTML !== recordHtml) {
                div.innerHTML = recordHtml;
            }
        });

        Object.keys(existingRecords).forEach(recordId => {
            if (!sortedRecords.find(record => record.id === recordId)) {
                recordsContainer.removeChild(existingRecords[recordId]);
            }
        });
    }
}

async function monitorColumnsContinuously(recordId, columnType = null) {
    const retryInterval = 5000;
    let attempts = 0;

    const maxAttempts = columnType === "X-Twitter Visu" ? 30 : 12;

    const interval = setInterval(async () => {
        let contentFound = false;

        for (const columnName of outputColumns) {
            const contentExists = await checkColumnForContent(recordId, columnName.trim());
            if (contentExists) {
                console.log(`Contenu détecté pour l'enregistrement ${recordId}, colonne: ${columnName}`);
                contentFound = true;
                readContent();
            }
        }

        if (contentFound) {
            attempts = 0;
        } else if (attempts >= maxAttempts) {
            console.log(`Aucun contenu trouvé après ${maxAttempts} tentatives.`);
            clearInterval(interval);
        } else {
            attempts++;
            console.log(`Tentative ${attempts} - Aucun contenu trouvé pour l'enregistrement ${recordId}.`);
        }
    }, retryInterval);
}

async function checkColumnForContent(recordId, columnName) {
    try {
        const recordData = await airtableRequest('GET', `/${recordId}`);
        if (recordData.fields && recordData.fields[columnName]) {
            const columnContent = recordData.fields[columnName];

            if (Array.isArray(columnContent) && columnContent.length > 0) {
                for (const item of columnContent) {
                    if (item.type === 'application/pdf' || item.url) {
                        return true;
                    }
                }
            }

            if (typeof columnContent === 'string' && columnContent.trim() !== '') {
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

function downloadFile(url, fileName) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const urlBlob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlBlob;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(urlBlob);
        })
        .catch(err => console.error('Erreur lors du téléchargement du fichier:', err));
}

async function findRecordByCustomId(customId) {
    const data = await airtableRequest('GET', '');
    if (data) {
        const record = data.records.find(record => record.fields["ID"] === parseInt(customId));
        return record ? record.id : null;
    }
    return null;
}

async function createNewRecord(newContent, selectedActionValue) {
    const actionToSend = actionMapping[selectedActionValue] || null;
    const data = {
        fields: {
            "Contenu de Départ": newContent || "...",
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

            readContent();
            monitorColumnsContinuously(newRecordId, columnType);
        } else {
            alert(`Erreur lors de la création: ${response?.error?.message || 'Réponse inattendue'}`);
        }
    } catch (error) {
        alert('Une erreur est survenue lors de la création du nouvel enregistrement.');
    }
}

async function updateContentByCustomId(customId, newContent) {
    const recordId = await findRecordByCustomId(customId);
    if (recordId) {
        await updateContent(recordId, newContent);
    } else {
        console.error(`Enregistrement avec ID ${customId} introuvable`);
    }
}

async function updateContent(recordId, newContent) {
    const data = {
        fields: {
            "Contenu de Départ": newContent
        }
    };
    const response = await airtableRequest('PATCH', `/${recordId}`, data);
    if (response && response.fields) {
        readContent();
        monitorColumnsContinuously(recordId);
    }
}


// New-content.js

/*const outputColumns = [
    "Article de Blog",
    "Linkedin Post",
    "Linkedin Visuel",
    "Linkedin Carroussel",
    "X-Twitter Visu",
    "Instagram Story Cover",
    "Lead Magnet"
];

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

// Fonction pour trouver un enregistrement par ID personnalisé
async function findRecordByCustomId(customId) {
    const data = await airtableRequest('GET', '');
    if (data) {
        const record = data.records.find(record => record.fields["ID"] === parseInt(customId));
        return record ? record.id : null;
    }
    return null;
}

// Fonction pour créer un nouvel enregistrement avec un contenu par défaut
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

            readContent(); // Actualiser l'interface après création
            monitorColumnsContinuously(newRecordId, columnType); // Surveillance continue pour la détection des contenus
        } else {
            alert(`Erreur lors de la création : ${response?.error?.message || 'Réponse inattendue'}`);
        }
    } catch (error) {
        alert('Une erreur est survenue lors de la création du nouvel enregistrement.');
    }
}

// Fonction pour supprimer les enregistrements sélectionnés
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

    readContent(); // Actualiser l'interface après suppression
}

// Fonction pour supprimer un enregistrement par ID personnalisé
async function deleteContentByCustomId(customId) {
    const recordId = await findRecordByCustomId(customId);
    if (recordId) {
        const response = await airtableRequest('DELETE', `/${recordId}`);
        if (response) {
            console.log(`Enregistrement avec ID ${customId} supprimé`);
            readContent(); // Actualiser l'interface après suppression
        }
    } else {
        console.error(`Enregistrement avec ID ${customId} introuvable pour suppression`);
    }
}


async function readContent() {
    const data = await airtableRequest('GET', '');
    console.log("Données récupérées depuis Airtable:", data);

    if (data) {
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = ''; // Réinitialiser l'interface

        const sortedRecords = data.records.sort((a, b) => {
            const idA = a.fields["ID"] ? String(a.fields["ID"]) : ''; 
            const idB = b.fields["ID"] ? String(b.fields["ID"]) : ''; 
            return idA.localeCompare(idB); 
        });

        sortedRecords.forEach(record => {
            const fields = record.fields;
            const recordId = record.id;

            let div = document.createElement('div');
            div.setAttribute('data-record-id', recordId);
            div.classList.add('tab-line');

            let contentInput = `<input type="text" id="prompt-${recordId}" value="${fields['Contenu de Départ'] || ''}" />`;

            let actionSelect = `
                <select id="action-${recordId}">
                    <option value="">--Sélectionnez une action--</option>
                    <option value="action1">Media to Transcription</option>
                    <option value="action2">Article de Blog</option>
                    <option value="action3">5X Images Twitter</option>
                    <option value="action4">Carousel to video</option>
                    <option value="action5">Instagram Story Cover</option>
                    <option value="action6">2X Post Linkedin</option>
                    <option value="action7">Carroussel Linkedin</option>
                    <option value="action8">Lead Magnet</option>
                </select>`;

            let createdAt = `<span>${new Date(record.createdTime).toLocaleDateString()}</span>`;

            let statusButton = `<button onclick="handleEditRecord('${recordId}', this)">Envoyer</button>`;

            let previewLinks = '';
            outputColumns.forEach(columnName => {
                const columnContent = fields[columnName];

                if (typeof columnContent === 'string' && columnContent.trim() !== '') {
                    // Gestion des contenus textuels (ex : Articles de blog, Posts LinkedIn)
                    previewLinks += `<li><strong>${columnName}:</strong>
                                        <button onclick="openModal(&quot;${encodeURIComponent(columnContent)}&quot;)">Voir plus</button>
                                     </li>`;
                } else if (Array.isArray(columnContent)) {
                    columnContent.forEach(item => {
                        if (item.url && (item.type.includes('image') || item.url.endsWith('.jpg') || item.url.endsWith('.png'))) {
                            // Afficher la miniature de l'image et l'ouvrir dans un nouvel onglet au clic
                            previewLinks += `<li><strong>${columnName}:</strong>
                                                <img src="${item.url}" style="width: 100px; height: auto; cursor: pointer;" onclick="window.open('${item.url}', '_blank')">
                                             </li>`;
                        } else if (item.url) {
                            // Si ce n'est pas une image, afficher les options de prévisualisation et de téléchargement
                            const fileName = item.filename || 'file';
                            previewLinks += `<li><strong>${columnName}:</strong>
                                                <a href="${item.url}" target="_blank">Prévisualiser</a> |
                                                <a href="${item.url}" download="${fileName}">Télécharger</a>
                                             </li>`;
                        }
                    });
                }
            });

            if (!previewLinks) {
                previewLinks = '<li>Aucun contenu généré</li>';
            }

            let deleteCheckbox = `<input type="checkbox" class="record-checkbox" data-id="${fields["ID"]}">`;

            div.innerHTML = `
                ${deleteCheckbox}
                <ul class="tab-line">
                    <li> ${fields["ID"] || 'Non défini'}</li>
                    <li> ${contentInput}</li>
                    <li> ${actionSelect}</li>
                    <li> ${createdAt}</li>
                    <li> ${statusButton}</li>
                    <li> <ul>${previewLinks}</ul></li>
                </ul>
                <hr>
            `;
            recordsContainer.appendChild(div);
        });
    }
}



async function handleEditRecord(recordId, buttonElement) {
    const prompt = document.getElementById(`prompt-${recordId}`).value;
    const actionKey = document.getElementById(`action-${recordId}`).value;

    if (!prompt.trim()) {
        console.error("Le champ 'Contenu de Départ' est vide.");
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
        buttonElement.innerHTML = 'Modifier';
        return;
    }

    console.log('Données envoyées à Airtable:', data);

    try {
        const response = await airtableRequest('PATCH', `/${recordId}`, data);
        if (!response || response.error) {
            console.error('Erreur lors de la mise à jour:', response ? response.error : 'Aucune réponse reçue.');
            return;
        }
        console.log('Modification envoyée avec succès!');
        monitorColumnsContinuously(recordId); // Redémarrer la surveillance ici
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
    }

    buttonElement.innerHTML = 'Modifier';
}

async function monitorColumnsContinuously(recordId) {
    const retryInterval = 5000;
    let attempts = 0;
    const maxAttempts = 12;

    const interval = setInterval(async () => {
        let contentFound = false;
        for (const columnName of outputColumns) {
            const contentExists = await checkColumnForContent(recordId, columnName.trim());
            if (contentExists) {
                contentFound = true;
                readContent(); // Recharge l'interface dès qu'un contenu est trouvé
                break;
            }
        }

        if (contentFound) {
            attempts = 0;  // Reset attempts to allow detection of multiple contents
        } else if (attempts >= maxAttempts) {
            console.log(`Aucun contenu trouvé après ${maxAttempts} tentatives.`);
            clearInterval(interval);
        } else {
            attempts++;
            console.log(`Tentative ${attempts} - Aucun contenu trouvé pour l'enregistrement ${recordId}.`);
        }
    }, retryInterval);
}

async function checkColumnForContent(recordId, columnName) {
    try {
        const recordData = await airtableRequest('GET', `/${recordId}`);
        if (recordData.fields && recordData.fields[columnName]) {
            const columnContent = recordData.fields[columnName];
            if (Array.isArray(columnContent) && columnContent.length > 0) {
                return true;
            }
            if (typeof columnContent === 'string' && columnContent.trim() !== '') {
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
*/