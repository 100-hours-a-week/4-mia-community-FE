import { getServerUrl } from '../utils/function.js';
import {requestJsonWithAuth} from '../utils/request.js';

export const deleteComment = (postId, commentId) => {
    return requestJsonWithAuth(
        `${getServerUrl()}/posts/${postId}/comments/${commentId}`,
        {
            method: 'DELETE',
            credentials: 'include',
        },
    );
};

export const updateComment = (postId, commentId, commentContent) => {
    return requestJsonWithAuth(
        `${getServerUrl()}/posts/${postId}/comments/${commentId}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(commentContent),
        },
    );
};
