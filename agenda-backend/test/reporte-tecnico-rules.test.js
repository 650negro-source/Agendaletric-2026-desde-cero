const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertCanEdit,
  assertCanPublish,
  assertCanRequestCorrection,
} = require("../src/modules/reportes-tecnicos/reporte-tecnico.rules");

test("draft and correction-requested reports can be edited and published", () => {
  for (const status of ["BORRADOR", "REQUIERE_CORRECCION"]) {
    assert.doesNotThrow(() => assertCanEdit(status));
    assert.doesNotThrow(() => assertCanPublish(status));
  }
});

test("published reports cannot be edited or published again until correction", () => {
  assert.throws(
    () => assertCanEdit("PUBLICADO"),
    { status: 409 }
  );
  assert.throws(
    () => assertCanPublish("PUBLICADO"),
    { status: 409 }
  );
});

test("only published reports can be sent back for correction", () => {
  assert.doesNotThrow(() => assertCanRequestCorrection("PUBLICADO"));
  assert.throws(
    () => assertCanRequestCorrection("BORRADOR"),
    { status: 409 }
  );
  assert.throws(
    () => assertCanRequestCorrection("REQUIERE_CORRECCION"),
    { status: 409 }
  );
});
