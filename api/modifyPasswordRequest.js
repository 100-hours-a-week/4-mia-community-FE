import { getServerUrl } from '../utils/function.js';
import { requestJsonWithAuth} from '../utils/request.js';

export const changePassword = async password => {
    return requestJsonWithAuth(`${getServerUrl()}/users/me/password`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            newPassword: password,
            confirmPassword: password,
        }),
    });
}
