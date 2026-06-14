export const parseJsonSafe = async response => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return null;
    }
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
};

export const requestJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const body = await parseJsonSafe(response);

    return {
        response,
        ok: response.ok,
        status: response.status,
        code: body && body.code ? body.code : null,
        data: body && Object.prototype.hasOwnProperty.call(body, 'data')
            ? body.data
            : null,
        body,
    };
};

// localStorage의 accessToken을 Authorization 헤더에 담아 요청
export const requestJsonWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');

    const headers = {
        ...(options.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return requestJson(url, {
        ...options,
        headers,
    });
};