import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const userSignup = async data => {
    return await requestJson(`${getServerUrl()}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
};

export const checkEmail = async email => {
    return await requestJson(
        `${getServerUrl()}/users/email/check?email=${email}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );
};

export const checkNickname = async nickname => {
    return await requestJson(
        `${getServerUrl()}/users/nickname/check?nickname=${nickname}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );
};

export const fileUpload = async file => {
    return await requestJson(
        `${getServerUrl()}/users/profile`,
        {
            method: 'POST',
            body: file,
        },
    );
};
