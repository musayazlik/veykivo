import assert from "node:assert/strict";
import test from "node:test";
import { serializeJsonLd } from "../src/lib/json-ld.ts";

test("JSON-LD content cannot close its script element and retains its JSON value", () => {
  const data = { headline: '</script><img src=x onerror=alert(1)>', description: 'Türkçe & "alıntı"' };
  const serialized = serializeJsonLd(data);
  assert.equal(serialized.includes("<"), false);
  assert.deepEqual(JSON.parse(serialized), data);
});
