// Many banks (especially German ones) export MT940 as Windows-1252/ISO-8859-1.
// A fatal UTF-8 decode throws on invalid byte sequences, which tells us the
// file is not UTF-8. Windows-1252 then serves as the fallback (it is a
// superset of ISO-8859-1 in practice, and never fails).
export function decodeMt940Bytes(bytes) {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        return new TextDecoder('windows-1252').decode(bytes);
    }
}
