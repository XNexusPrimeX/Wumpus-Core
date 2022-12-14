import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import { Logger } from '../utils';
import readline from 'readline';
import { setTimeout as sleep } from 'node:timers/promises';

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

function logTips() {
    console.clear();
    console.log(`${chalk.blue('>>')} You are running on dev mode`);
    
    Object.entries({
        r: 'Reload',
        "Ctrl+C": 'Stop process'
    }).forEach(([k, v]) => console.log(`   ${k}: ${chalk.blue(v)}`));
    
    console.log('');
}
logTips();

let client = runNewClient();

process.stdin.on('keypress', async (ch, key) => {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    if(key.ctrl && key.name === 'c') {
        process.exit(0)
    }
    else if(key.name === 'r') {
        process.stdout.write(`${chalk.blue('>>')} Restarting...`);
        
        client.removeAllListeners();
        client.stdout.removeAllListeners();
        client.stdin.removeAllListeners();
        client.kill();

        await sleep(500);
        
        logTips();
        client = runNewClient();
    }
});

function runNewClient() {
    const client = spawn('node', [
        path.join(__dirname, '../client/dev.js')
    ]);

    client.stderr.on('data', data => {
        console.log(data.toString('utf-8'))
        Logger.error(undefined, data);
    });

    [client.stdout, client.stdin].forEach(listener => {
        listener.on('data', (data) => {
            Logger.from(Buffer.from(data).toString('utf-8'));
        })
    })
    client.on('exit', () => process.stdout.write(`\n${chalk.yellow("!")} Exited`));

    return client;
}