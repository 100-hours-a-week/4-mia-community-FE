import { getServerUrl } from '../utils/function.js';
import { requestJsonWithAuth } from '../utils/request.js';

export const getPost = postId =>
    requestJsonWithAuth(`${getServerUrl()}/posts/${postId}`, {
        credentials: 'include',
    });

export const deletePost = postId =>
    requestJsonWithAuth(`${getServerUrl()}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
    });

export const writeComment = (pageId, comment) =>
    requestJsonWithAuth(`${getServerUrl()}/posts/${pageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: comment }),
    });

export const getComments = postId =>
    requestJsonWithAuth(`${getServerUrl()}/posts/${postId}/comments`, {
        credentials: 'include',
    });

export const likePost = postId =>
    requestJsonWithAuth(`${getServerUrl()}/posts/${postId}/likes`, {
        method: 'POST',
        credentials: 'include',
    });

export const unlikePost = postId =>
    requestJsonWithAuth(`${getServerUrl()}/posts/${postId}/likes`, {
        method: 'DELETE',
        credentials: 'include',
    });