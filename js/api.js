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
