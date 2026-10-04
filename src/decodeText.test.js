import { TextDecoder as NodeTextDecoder } from 'util';
import { decodeMt940Bytes } from './decodeText';

describe('decodeMt940Bytes', () => {
    beforeAll(() => {
        // jsdom in CRA's Jest does not provide TextDecoder, so use Node's.
        // Some Node 20.x releases decode windows-1252 like latin1 (0x80
        // becomes U+0080 instead of the euro sign) unless decoding in stream
        // mode, so decode in stream mode and flush to behave like browsers.
        global.TextDecoder = class extends NodeTextDecoder {
            decode(input) {
                return super.decode(input, { stream: true }) + super.decode();
            }
        };
    });

    test('decodes Windows-1252 bytes (Mueller with u-umlaut)', () => {
        const bytes = new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72]);
        expect(decodeMt940Bytes(bytes)).toBe('Müller');
    });

    test('decodes Windows-1252 specific characters (euro sign)', () => {
        expect(decodeMt940Bytes(new Uint8Array([0x80]))).toBe('€');
    });

    test('leaves UTF-8 input unchanged', () => {
        const bytes = new Uint8Array([0x4d, 0xc3, 0xbc, 0x6c, 0x6c, 0x65, 0x72]);
        expect(decodeMt940Bytes(bytes)).toBe('Müller');
    });

    test('leaves ASCII input unchanged', () => {
        const bytes = new Uint8Array([0x3a, 0x32, 0x30, 0x3a, 0x41]);
        expect(decodeMt940Bytes(bytes)).toBe(':20:A');
    });

    test('strips a UTF-8 BOM', () => {
        const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x3a, 0x32, 0x30, 0x3a]);
        expect(decodeMt940Bytes(bytes)).toBe(':20:');
    });

    test('accepts an ArrayBuffer', () => {
        const buffer = new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72]).buffer;
        expect(decodeMt940Bytes(buffer)).toBe('Müller');
    });
});
