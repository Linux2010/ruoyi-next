// 统一的 BigInt / Bytes / Date 安全序列化，供自定义接口复用。
export function jsonSafe<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (typeof input === "bigint") {
    const n = Number(input);
    return (Number.isSafeInteger(n) ? n : input.toString()) as unknown as T;
  }
  if (input instanceof Date) return input;
  if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
    return Buffer.from(input as Uint8Array).toString("utf8") as unknown as T;
  }
  if (Array.isArray(input)) return input.map((v) => jsonSafe(v)) as unknown as T;
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = jsonSafe(v);
    }
    return out as unknown as T;
  }
  return input;
}
