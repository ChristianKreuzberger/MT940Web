// Stub mirroring the current behavior (non-fatal UTF-8 only).
export function decodeMt940Bytes(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
}
