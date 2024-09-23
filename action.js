const actionMapping = {
    action1: "recSNEdTbfKt3QLtj", // Media to Transcription
    action2: "recLCRZ5B8L7EQF8r", // Article de Blog
    action3: "recomuHlxLhRPCGjZ", // 5X Images Twitter
    action4: "rec2bqCaTePro5HOe", // Carousel to video
    action5: "recco0HETntjkSlOM", // Instagram Story Cover
    action6: "recNN9hmSDHl3N695", // 2X Post Linkedin
    action7: "recAMOvaR6SDzJ3QE", // Carroussel Linkedin
    action8: "recl7pszC8cziOlAu"  // Lead Magnet
};

async function updateTransformationActions(recordId) {
    const selectElement = document.getElementById('actionSelect');
    const selectedActionValue = selectElement.value;

    if (!selectedActionValue) {
        alert("Please select an action.");
        return;
    }

    const actionToSend = actionMapping[selectedActionValue];
    const data = {
        fields: {
            "ACTIONS": [actionToSend]
        }
    };

    const response = await airtableRequest('PATCH', `/${recordId}`, data);
    if (response) {
        console.log('Enregistrement mis à jour avec succès:', response);
        readContent();
    } else {
        console.error('Erreur lors de la mise à jour');
    }
}
