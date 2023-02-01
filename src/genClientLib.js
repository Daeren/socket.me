const fs = require('fs');
const path = require('path');

//--------------------------------------------------

function genClientLib(targets) {
    const libs = load();

    let txtModules = 'const __g_ctx__ = {};';
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
            txtClient = txtClient.replace(/require\(.+\)/, `__g_ctx__.${name}.exports`);
        }
    }

    for(const [name, lib] of Object.entries(libs)) {
        const makeBody = (v) => `__g_ctx__.${name} = {};((module) => { ${v} })(__g_ctx__.${name});`;

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
                window.mio = __g_ctx__.mio.exports;
            })();
        `,
        common: `
            (function() {
                ${raw}
                module.export = __g_ctx__.mio.exports;
            })();
        `,
        es6: `
            export default (function() {
                ${raw}
                return __g_ctx__.mio.exports;
            })();
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
