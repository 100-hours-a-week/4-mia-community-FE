import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const createPost = boardData => {
    return requestJson(`${getServerUrl()}/posts`, {
        method: 'POST',
        body: JSON.stringify(boardData),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
};

export const updatePost = (postId, boardData) => {
    return requestJson(`${getServerUrl()}/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(boardData),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
};

export const fileUpload = formData => {
    return requestJson(getServerUrl() + '/posts/upload/attach-file', {
        method: 'POST',
        body: formData,
    });
};

export const getBoardItem = postId => {
    return  requestJson(getServerUrl() + `/posts/${postId}`, {
        method: 'GET',
        credentials: 'include',
    });
};
