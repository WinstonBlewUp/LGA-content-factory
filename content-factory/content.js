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

        // Convertir les enregistrements en tableau et les trier par 'ID personnalisé' ou un autre champ stable
        const sortedRecords = data.records.sort((a, b) => {
            const idA = a.fields["ID"] ? String(a.fields["ID"]) : ''; 
            const idB = b.fields["ID"] ? String(b.fields["ID"]) : ''; 
            return idA.localeCompare(idB); // Comparer les IDs pour un ordre stable
        });

        // Garder une trace des enregistrements déjà existants dans le DOM
        const existingRecords = {};
        Array.from(recordsContainer.children).forEach(div => {
            const recordId = div.getAttribute('data-record-id');
            if (recordId) existingRecords[recordId] = div;
        });

        // Parcourir les enregistrements triés et mettre à jour ou ajouter les enregistrements dans le conteneur
        sortedRecords.forEach(record => {
            const fields = record.fields;
            const recordId = record.id;

            let div = existingRecords[recordId];
            let outputLinks = '';

            // Créer un div s'il n'existe pas déjà
            if (!div) {
                div = document.createElement('div');
                div.setAttribute('data-record-id', recordId);
                recordsContainer.appendChild(div);
            }

            // Gérer chaque type de contenu
            for (const [fieldName, fieldValue] of Object.entries(fields)) {
                const trimmedFieldName = fieldName.trim();

                // Articles de blog
                if (trimmedFieldName === "Article de Blog" && typeof fieldValue === 'string') {
                    outputLinks += `
                        <li>
                            <strong>${trimmedFieldName}:</strong>
                            <button onclick="openModal(&quot;${encodeURIComponent(fieldValue)}&quot;)">Voir plus</button>
                        </li>`;
                }

                // Posts LinkedIn
                else if (trimmedFieldName === "Linkedin Post" && typeof fieldValue === 'string') {
                    outputLinks += `
                        <li>
                            <strong>${trimmedFieldName}:</strong>
                            <button onclick="openModal(&quot;${encodeURIComponent(fieldValue)}&quot;)">Voir plus</button>
                        </li>`;
                }

                // Fichiers (images, PDF, etc.)
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
                }

                // Liens externes
                else if (typeof fieldValue === 'string' && fieldValue.startsWith('http')) {
                    outputLinks += `<li><strong>${trimmedFieldName}:</strong> <a href="${fieldValue}" target="_blank">Voir</a></li>`;
                }

                // Autres contenus textuels
                else if (typeof fieldValue === 'string' && fieldValue.trim() !== '') {
                    outputLinks += `<li><strong>${trimmedFieldName}:</strong> ${fieldValue}</li>`;
                }
            }

            // Si aucun contenu trouvé
            if (!outputLinks) {
                outputLinks = '<li>Aucun contenu généré</li>';
            }

            // Générer le contenu HTML du record
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

            // Mise à jour uniquement si le contenu a changé
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


