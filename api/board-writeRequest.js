import { getServerUrl } from '../utils/function.js';
import {requestJsonWithAuth} from '../utils/request.js';

export const createPost = boardData => {
    return requestJsonWithAuth(`${getServerUrl()}/posts`, {
        method: 'POST',
        body: JSON.stringify(boardData),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
};

export const updatePost = (postId, boardData) => {
    return requestJsonWithAuth(`${getServerUrl()}/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(boardData),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
};

export const fileUpload = formData => {
    return requestJsonWithAuth(getServerUrl() + '/posts/upload/attach-file', {
        method: 'POST',
        body: formData,
    });
};

export const getBoardItem = postId => {
    return  requestJsonWithAuth(getServerUrl() + `/posts/${postId}`, {
        method: 'GET',
        credentials: 'include',
    });
};
