// Decode Azure Easy Auth headers
// https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities

// Object to group header name constants.
const HEADERS = {
    CLIENT_PRINCIPAL: 'X-MS-CLIENT-PRINCIPAL',
    CLIENT_PRINCIPAL_ID: 'X-MS-CLIENT-PRINCIPAL-ID',
    CLIENT_PRINCIPAL_IDP: 'X-MS-CLIENT-PRINCIPAL-IDP',
    CLIENT_PRINCIPAL_NAME: 'X-MS-CLIENT-PRINCIPAL-NAME',
};

// Object to group claim type constants.
const CLAIM_TYPES = {
    EMAIL: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    NAME: 'name',
    OBJECT_ID: 'http://schemas.microsoft.com/identity/claims/objectidentifier',
    PREFERRED_USERNAME: 'preferred_username',
    GROUPS: 'groups',
};

// Get the 'X-MS-CLIENT-PRINCIPAL' header and return its value.
const getHeaderClientPrincipal = (r) => {
    const header = r.headersIn[HEADERS.CLIENT_PRINCIPAL];
    if (!header) {
        r.warn('X-MS-CLIENT-PRINCIPAL header not found');
        return null;
    }
    return header;
}

// Get the 'X-MS-CLIENT-PRINCIPAL-ID' header and return its value.
const getHeaderClientPrincipalId = (r) => {
    const header = r.headersIn[HEADERS.CLIENT_PRINCIPAL_ID];
    if (!header) {
        r.warn('X-MS-CLIENT-PRINCIPAL-ID header not found');
        return null;
    }
    return header;
}

// Get the 'X-MS-CLIENT-PRINCIPAL-IDP' header and return its value.
const getHeaderClientPrincipalIdp = (r) => {
    const header = r.headersIn[HEADERS.CLIENT_PRINCIPAL_IDP];
    if (!header) {
        r.warn('X-MS-CLIENT-PRINCIPAL-IDP header not found');
        return null;
    }
    return header;
}

// Get the 'X-MS-CLIENT-PRINCIPAL-NAME' header and return its value.
const getHeaderClientPrincipalName = (r) => {
    const header = r.headersIn[HEADERS.CLIENT_PRINCIPAL_NAME];
    if (!header) {
        r.warn('X-MS-CLIENT-PRINCIPAL-NAME header not found');
        return null;
    }
    return header;
}

// Decode and parse the 'X-MS-CLIENT-PRINCIPAL' header into a JSON object.
const decodeHeaderClientPrincipal = (r) => {
    const header = getHeaderClientPrincipal(r);
    if (!header) {
        return null;
    }
    try {
        const decoded = Buffer.from(header, 'base64').toString();
        const clientPrincipal = JSON.parse(decoded);
        return clientPrincipal;
    } catch (e) {
        r.error('Failed to decode X-MS-CLIENT-PRINCIPAL: ' + e.message);
        return null;
    }
};

// Extract claims from the decoded client principal and return them as an object.
const getClaims = (r) => {
    if (r.cachedClaims !== undefined) {
        return r.cachedClaims;
    }

    const clientPrincipal = decodeHeaderClientPrincipal(r);
    if (!clientPrincipal || !clientPrincipal.claims || !Array.isArray(clientPrincipal.claims)) {
        r.cachedClaims = null;
        return null;
    }

    const claims = {};
    clientPrincipal.claims.forEach(claim => {
        if (claim.typ && claim.val !== undefined) {
            if (!claims[claim.typ]) {
                claims[claim.typ] = [];
            }
            claims[claim.typ].push(claim.val);
        }
    });

    r.cachedClaims = claims;
    return claims;
};

// Retrieve all values for a specific claim type from the claims object.
const getClaimValues = (r, claimType) => {
    const claims = getClaims(r);
    if (!claims || !claims[claimType]) {
        return [];
    }
    return claims[claimType];
};

// Retrieve the first value for a specific claim type from the claims object.
const getClaimValue = (r, claimType) => {
    const values = getClaimValues(r, claimType);
    return values.length > 0 ? values[0] : null;
};

// Alias for getClaimValue to retrieve a specific claim value.
const getClaim = getClaimValue;

// Retrieve the email address claim value.
const getClaimEmail = (r) => {
    return getClaimValue(r, CLAIM_TYPES.EMAIL);
};

// Retrieve the name claim value.
const getClaimName = (r) => {
    return getClaimValue(r, CLAIM_TYPES.NAME);
};

// Retrieve the object identifier claim value.
const getClaimObjectId = (r) => {
    return getClaimValue(r, CLAIM_TYPES.OBJECT_ID);
};

// Retrieve the preferred username claim value.
const getClaimPreferredUsername = (r) => {
    return getClaimValue(r, CLAIM_TYPES.PREFERRED_USERNAME);
};

// Retrieve all group claim values.
const getClaimGroups = (r) => {
    return getClaimValues(r, CLAIM_TYPES.GROUPS);
};

// Check if a specific group ID exists in the group claims.
const hasClaimGroup = (r, groupId) => {
    const groups = getClaimGroups(r);
    return groups.includes(groupId);
};

export default {
    HEADERS,
    CLAIM_TYPES,
    getHeaderClientPrincipal,
    getHeaderClientPrincipalId,
    getHeaderClientPrincipalName,
    getHeaderClientPrincipalIdp,
    decodeHeaderClientPrincipal,
    getClaims,
    getClaim,
    getClaimValue,
    getClaimValues,
    getClaimEmail,
    getClaimName,
    getClaimObjectId,
    getClaimPreferredUsername,
    getClaimGroups,
    hasClaimGroup,
};
