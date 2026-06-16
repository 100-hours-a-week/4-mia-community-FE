import { getServerUrl } from '../utils/function.js';
import {requestJson, requestJsonWithAuth} from '../utils/request.js';

export const getPosts = (offset, limit) => {
    return requestJsonWithAuth(
        `${getServerUrl()}/posts?offset=${offset}&limit=${limit}`,
        {
            credentials: 'include',
        },
    );
};

export const searchPosts = (keyword, offset = 0, limit = 5, sort = 'recent') => {
    const query = new URLSearchParams({
        keyword,
        offset,
        limit,
        sort,
    });

    return requestJsonWithAuth(
        `${getServerUrl()}/posts/search?${query.toString()}`,
        {
            credentials: 'include',
        },
    );
};
