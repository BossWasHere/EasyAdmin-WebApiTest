import dotenv from 'dotenv';
dotenv.config();

import { init } from './app';

['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, handleExit);
});

function handleExit(signal: string) {
    console.debug(`Received ${signal}, exiting...`);
    process.exit();
}

init();
