// Decode Azure Easy Auth headers
// https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities

const getHeaderClientPrincipal = (r) => {
    const header = r.headersIn['X-MS-CLIENT-PRINCIPAL'];
    if (!header) {
        r.warn('X-MS-CLIENT-PRINCIPAL header not found');
        return null;
    }
    return header;
}

const getHeaderClientPrincipalId = (r) => {
    const header = r.headersIn['X-MS-CLIENT-PRINCIPAL-ID'];
    if (!header) {
        r.warn('X-MS-CLIENT-PRINCIPAL-ID header not found');
        return null;
    }
    return header;
}

const getHeaderClientPrincipalIdp = (r) => {
    const header = r.headersIn['X-MS-CLIENT-PRINCIPAL-IDP'];
    if (!header) {
        r.warn('X-MS-CLIENT-PRINCIPAL-IDP header not found');
        return null;
    }
    return header;
}

const getHeaderClientPrincipalName = (r) => {
    const header = r.headersIn['X-MS-CLIENT-PRINCIPAL-NAME'];
    if (!header) {
        r.warn('X-MS-CLIENT-PRINCIPAL-NAME header not found');
        return null;
    }
    return header;
}

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

const getClaims = (r) => {
    const clientPrincipal = decodeHeaderClientPrincipal(r);
    if (!clientPrincipal || !clientPrincipal.claims || !Array.isArray(clientPrincipal.claims)) {
        return null;
    }
    const claimsObj = {};
    clientPrincipal.claims.forEach(claim => {
        if (claim.typ && claim.val !== undefined) {
            if (claimsObj[claim.typ]) {
                if (Array.isArray(claimsObj[claim.typ])) {
                    claimsObj[claim.typ].push(claim.val);
                } else {
                    claimsObj[claim.typ] = [claimsObj[claim.typ], claim.val];
                }
            } else {
                claimsObj[claim.typ] = claim.val;
            }
        }
    });
    return claimsObj;
};

const getClaim = (r, claimType) => {
    const claimsObj = getClaims(r);
    if (!claimsObj || claimsObj[claimType] === undefined) {
        return null;
    }
    return claimsObj[claimType];
};

const getClaimEmail = (r) => {
    return getClaim(r, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress');
};

const getClaimName = (r) => {
    return getClaim(r, 'name');
};

const getClaimObjectId = (r) => {
    return getClaim(r, 'http://schemas.microsoft.com/identity/claims/objectidentifier');
};

const getClaimPreferredUsername = (r) => {
    return getClaim(r, 'preferred_username');
};

const getClaimGroups = (r) => {
    const groups = getClaim(r, 'groups');
    if (Array.isArray(groups)) {
        return groups;
    }
    if (groups) {
        return [groups];
    }
    return [];
};

const hasClaimGroup = (r, groupId) => {
    const groups = getClaimGroups(r);
    return groups.includes(groupId);
};

export default {
    getHeaderClientPrincipal,
    getHeaderClientPrincipalId,
    getHeaderClientPrincipalName,
    getHeaderClientPrincipalIdp,
    decodeHeaderClientPrincipal,
    getClaims,
    getClaim,
    getClaimEmail,
    getClaimName,
    getClaimObjectId,
    getClaimPreferredUsername,
    getClaimGroups,
    hasClaimGroup,
};
