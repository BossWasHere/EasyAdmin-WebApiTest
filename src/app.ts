import cors from 'cors';
import express from 'express';

import ApiRouter from './routes/api.r';

const port = process.env.PORT ?? 3000;
const originWhitelist = process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? [];
const apiVersion = process.env.API_VERSION ?? 'v1.0';

export function init() {
    const app = express();
    console.log(`API Version ${apiVersion}`);

    app.use(express.json());
    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin) {
                    return callback(null, true);
                }

                if (originWhitelist.indexOf(origin) === -1) {
                    return callback(new Error('Not allowed by CORS'));
                }

                return callback(null, true);
            },
        })
    );

    app.get('/', (_, res) => {
        return res.json({
            api: 'EasyAdmin',
            version: apiVersion,
            help: process.env.HELP_URL ?? '',
        });
    });

    app.use(`/${apiVersion}`, ApiRouter);
    app.use((_, res) => {
        return res.status(404).json({
            error: 'Not found',
        });
    });

    app.listen(port, () => {
        console.log(`Server listening at http://127.0.0.1:${port}`);
    });

    return app;
}
