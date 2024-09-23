const personalToken = 'patahXAWYvoTyBiKe.68abadb59de92483acd49bd8c442c592739d24c7d31e9eb015e5af37764675f5';
const baseId = 'appZSHv2O2bR0gILp'; 
const tableId = 'tblEimlX2EMpRBkMt';

async function airtableRequest(method, endpoint, data = null) {
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}${endpoint}`;
    const options = {
        method: method,
        headers: {
            Authorization: `Bearer ${personalToken}`,
            'Content-Type': 'application/json',
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        if (response.ok) {
            return await response.json();
        } else {
            const errorData = await response.json();
            console.error('Erreur lors de la requête:', errorData);
            return null;
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
        return null;
    }
}
