const API_BASE = 'http://127.0.0.1:8000';

export function login(username, password) {
    return fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
}

export function getCurrentUser(accessToken) {
    return fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export function createEncounter(accessToken, encounter) {
    return fetch(`${API_BASE}/encounters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(encounter),
    });
}

export function listEncounters(accessToken, offset = 0, limit = 9) {
    const query = new URLSearchParams({ offset, limit });

    return fetch(`${API_BASE}/encounters?${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export function deleteEncounter(accessToken, encounterId) {
    return fetch(`${API_BASE}/encounters/${encounterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export async function getAllEncounters(accessToken) {
    const encounters = [];
    const limit = 100;
    let offset = 0;

    while (true) {
        const response = await listEncounters(accessToken, offset, limit);

        if (!response.ok) {
            throw new Error(
                response.status === 401
                    ? 'Your session expired. Log in again from the home page.'
                    : 'Could not load your statistics. Please retry.'
            );
        }

        const batch = await response.json();
        encounters.push(...batch);

        if (batch.length < limit) return encounters;

        offset += limit;
    }
}

export function createAccount(username, password) {
    return fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
}
