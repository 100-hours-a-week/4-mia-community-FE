import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const getPost = postId => {
    return requestJson(`${getServerUrl()}/posts/${postId}`, {
        credentials: 'include',
    });
};

export const deletePost = async postId => {
    return await requestJson(`${getServerUrl()}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
};

export const writeComment = async (pageId, comment) => {
    return await requestJson(`${getServerUrl()}/posts/${pageId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ commentContent: comment }),
    });
};

export const getComments = async postId => {
    return await requestJson(`${getServerUrl()}/posts/${postId}/comments`, {
        credentials: 'include',
    });
};

export const likePost = async postId => {
    return await requestJson(`${getServerUrl()}/posts/${postId}/likes`, {
        method: 'POST',
        credentials: 'include',
    });
};

export const unlikePost = async postId => {
    return await requestJson(`${getServerUrl()}/posts/${postId}/likes`, {
        method: 'DELETE',
        credentials: 'include',
    });
};
