import { getServerUrl } from '../utils/function.js';
import { requestJsonWithAuth } from '../utils/request.js';

export const getPosts = (page = 1) => {
    const query = new URLSearchParams({ page: String(page) });
    return requestJsonWithAuth(
        `${getServerUrl()}/posts?${query.toString()}`,
        {
            credentials: 'include',
        },
    );
};

export const searchPosts = (keyword, page = 1, sort = 'recent') => {
    const query = new URLSearchParams({
        keyword,
        page: String(page),
        sort,
    });

    return requestJsonWithAuth(
        `${getServerUrl()}/posts/search?${query.toString()}`,
        {
            credentials: 'include',
        },
    );
};
