/** Script etiketi içindeki JSON'un HTML olarak yorumlanmasını önler. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
