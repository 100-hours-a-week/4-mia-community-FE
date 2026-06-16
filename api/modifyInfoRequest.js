import { getServerUrl } from '../utils/function.js';
import {requestJsonWithAuth} from '../utils/request.js';

export const userModify = async changeData => {
    return await requestJsonWithAuth(`${getServerUrl()}/users/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(changeData),
    });
};

export const userDelete = async () => {
    return await requestJsonWithAuth(`${getServerUrl()}/users/me`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
};
