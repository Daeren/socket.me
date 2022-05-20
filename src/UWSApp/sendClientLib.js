const zlib = require('zlib');

//---]>

const genClientLib = require('./../genClientLib');

//--------------------------------------------------

const zlibOptions = {
    level: zlib.constants.Z_BEST_COMPRESSION
};

const reDeflate = /\bdeflate\b/;
const reGzip = /\bgzip\b/;
const reBr = /\bbr\b/;

const { dist: libData } = genClientLib();

//--------------------------------------------------

module.exports = function() {
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
