import express  from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();

dotenv.config();

const port = process.env.PORT ||  3000;

// 현재 파일의 URL에서 디렉토리 경로를 추출
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(__dirname));

app.get('/config.js', (req, res) => {
    const apiBaseUrl =
            process.env.NODE_ENV === 'production'
                ? process.env.API_BASE_URL_PROD
                : process.env.API_BASE_URL_LOCAL;

    res.set('Cache-Control', 'no-store');
    res.type('application/javascript').send(
        `window.__APP_CONFIG__ = {
                    API_BASE_URL: ${JSON.stringify(apiBaseUrl)}
        };`,
    );
});

app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
