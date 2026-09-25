import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the TYMM local panel shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /TYMM/);
  assert.match(html, /Yerel veri|localStorage/i);
  assert.match(html, /Rubrik/i);
  assert.match(html, /Raporlama/i);
  assert.match(html, /Hazırbulunuşluk Değerlendirmesi/i);
  assert.match(html, /Performans Görevi/i);
  assert.match(html, /Süreç ve Kanıt Girişi/i);
  assert.match(html, /Otantik değerlendirme/i);
  assert.match(html, /Veli önerisi/i);
  assert.match(html, /Matematik/i);
  assert.match(html, /Fen Bilimleri/i);
  assert.match(html, /Türkçe/i);
  assert.match(html, /Yabancı Dil/i);
  assert.match(html, /Sosyal Bilgiler/i);
  assert.doesNotMatch(html, /Yetenek Puanı\s*\/\s*RIT|Gelişim Hızı\s*\(Slope\)|FIML|Madde Bankası\s*\/\s*IRT/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});
