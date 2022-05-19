const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

//--------------------------------------------------

const zlibOptions = {
    level: zlib.constants.Z_BEST_COMPRESSION
};

const reDeflate = /\bdeflate\b/;
const reGzip = /\bgzip\b/;
const reBr = /\bbr\b/;

const lib = buildModules([
    ['/src/client/index.js', 'client'],
    ['/src/client/tools.js', 'tools'],
    ['/src/shared/safe.js', 'safe'],
    ['/src/shared/messagePacker.js', 'messagePacker']
]);

//--------------------------------------------------

module.exports = function(packets) {
    const libPayload = `\r\n(window.mio && (window.mio.__staticPackets=${JSON.stringify(packets)}));`;
    const libData = lib + libPayload;

    const brParams =  {
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: libData.length
    };

    //---]>

    const libDeflate = zlib.deflateSync(libData, zlibOptions);
    const libGzip = zlib.gzipSync(libData, zlibOptions);
    const libBr = zlib.brotliCompressSync(libData, { ...zlibOptions, params: brParams });

    //---]>

    return function(acceptEncoding, response) {
        let data = '';

        if(acceptEncoding && typeof acceptEncoding === 'string') {
            if(reBr.test(acceptEncoding)) {
                acceptEncoding = 'br';
                data = libBr;
            }
            else if(reDeflate.test(acceptEncoding)) {
                acceptEncoding = 'deflate';
                data = libDeflate;
            }
            else if(reGzip.test(acceptEncoding)) {
                acceptEncoding = 'gzip';
                data = libGzip;
            }
        }

        response
            .writeHeader('content-encoding', acceptEncoding)
            .writeHeader('content-type', 'text/javascript')
            .end(data);
    };
}

//--------------------------------------------------

function buildModules(targets) {
    const libs = load();

    let txtModules = 'const global = {};';
    let txtClient = '';

    //---]>

    for(const [name, lib] of Object.entries(libs)) {
        if(name === 'client') {
            txtClient = lib;
        }
        else {
            const mdDecl = `global.${name} = {};`;
            const mdBody = `(function(module) { ${lib} })(global.${name});`;

            txtModules += mdDecl + mdBody;
        }
    }

    for(const [name] of Object.entries(libs)) {
        if(name !== 'client') {
            txtClient = txtClient.replace(/require\(.+\)/, `global.${name}.exports`);
        }
    }

    //---]>

    return `function mio(...args) { ${txtModules + txtClient} return main(...args); }`;

    //---]>

    function load() {
        const result = {};

        for(const [file, name] of targets) {
            result[name] = fs.readFileSync(path.join(__dirname, '..', '..', file)).toString();
        }

        return result;
    }
}

