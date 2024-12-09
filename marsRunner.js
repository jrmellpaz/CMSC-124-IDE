// marsRunner.js
const { exec } = require('child_process');
const path = require('path');
const { app } =  require('electron');

function runMars(asmFilePath) {
    const marsJarPath = path.join(app.getAppPath(), 'Mars4_5.jar'); // Update with your MARS.jar path
    const command = `java -jar ${marsJarPath} nc ${asmFilePath}`;

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error executing MARS: ${error.message}`);
                return;
            }

            if (stderr) {
                reject(`MARS stderr: ${stderr}`);
                return;
            }

            resolve(stdout);
            //return stdout; // Pass output to the callback
        });
    });
}

module.exports = { runMars };
