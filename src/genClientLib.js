const fs = require('fs');
const path = require('path');

//--------------------------------------------------

function genClientLib(targets) {
    const libs = load();

    let txtModules = 'const global = {};';
    let txtClient = '';

    //---]>

    for(const [name, lib] of Object.entries(libs)) {
        if(name === 'mio') {
            txtClient = lib;
            break;
        }
    }

    for(const [name] of Object.entries(libs)) {
        if(name !== 'mio') {
            txtClient = txtClient.replace(/require\(.+\)/, `global.${name}.exports`);
        }
    }

    for(const [name, lib] of Object.entries(libs)) {
        const makeBody = (v) => `global.${name} = {};((module) => { ${v} })(global.${name});`;

        if(name === 'mio') {
            txtClient = makeBody(txtClient);
        }
        else {
            txtModules += makeBody(lib);
        }
    }

    //---]>

    const raw = txtModules + txtClient;

    //---]>

    return {
        dist: `
            (function() {
                ${raw}
                window.mio = global.mio.exports;
            })();
        `,
        common: `
            ${raw}
            module.export = global.mio.exports;
        `,
        es6: `
            ${raw}
            export default global.mio.exports;
        `
    };

    //---]>

    function load() {
        const result = {};

        for(const [file, name] of targets) {
            result[name] = fs.readFileSync(path.join(__dirname, '..', file)).toString();
        }

        return result;
    }
}

//--------------------------------------------------

module.exports = () => {
    return genClientLib([
        ['/src/client/index.js', 'mio'],
        ['/src/client/tools.js', 'tools'],
        ['/src/shared/safe.js', 'safe'],
        ['/src/shared/messagePacker.js', 'messagePacker']
    ]);
};
