const assert = require('node:assert/strict');
// const test = require('node:test');

//---]>

const messagePacker = require('./../src/shared/messagePacker');

//--------------------------------------------------

const { pack, unpack } = messagePacker;

//--------------------------------------------------

function test(type, callback) { // shim : node.18
    console.log(type);
    callback();
}

//--------------------------------------------------

test('1. pack > unpack', () => {
    const a = unpack(pack('test'));
    const e = ['test', undefined, undefined];

    assert.deepStrictEqual(a, e);
});

test('2. pack > unpack', () => {
    const a = unpack(pack('test', null, [1, 2, 3, 'bin тест ё 120']));
    const e = ['test', undefined, [1, 2, 3, 'bin тест ё 120']];

    assert.deepStrictEqual(a, e);
});

test('3. pack > unpack', () => {
    const a = unpack(pack('test', 0, [1, 2, 3, 'bin тест ё 120']));
    const e = ['test', 0, [1, 2, 3, 'bin тест ё 120']];

    assert.deepStrictEqual(a, e);
});

test('4. pack > unpack', () => {
    const a = unpack(pack('test', 0));
    const e = ['test', 0, undefined];

    assert.deepStrictEqual(a, e);
});

test('5. pack > unpack', () => {
    const a = unpack(pack('test', 10));
    const e = ['test', 10, undefined];

    assert.deepStrictEqual(a, e);
});

test('6. pack > unpack', () => {
    const a = unpack(pack('test', 0, str2ab('bin тест ё 120')));
    const e = ['test', 0, str2ab('bin тест ё 120')];

    assert.deepStrictEqual(a, e);
});

test('7. unpack', () => {
    const a = unpack(undefined);
    const e = null;

    assert.strictEqual(a, e);
});

test('8. unpack', () => {
    const a = unpack(new ArrayBuffer(0));
    const e = null;

    assert.strictEqual(a, e);
});

test('9. unpack', () => {
    const [type, ack] = unpack(new ArrayBuffer(20));

    const a = [type, ack];
    const e = ['', undefined];

    assert.deepStrictEqual(a, e);
});

test('10. unpack', () => {
    const buf = new ArrayBuffer(20);
    const bufView = new Uint8Array(buf);

    bufView[0] = 2; // json

    const a = unpack(buf);

    assert.strictEqual(a instanceof Error, true);
});

//--------------------------------------------------

function str2ab(str) {
    const len = str.length;

    const buf = new ArrayBuffer(len * 2);
    const bufView = new Uint16Array(buf);

    for(let i = 0; i < len; i++) {
        bufView[i] = str.charCodeAt(i);
    }

    return buf;
}
