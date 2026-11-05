import test from "node:test"
import assert from "node:assert/strict"
import { rangeFor, filterEvents, getEvents } from "../schedule.js"
const zone = "America/Denver"
test("Monday, Friday, Saturday and Sunday resolve to the same weekend", () => {
  for (const from of ["2026-11-02", "2026-11-06", "2026-11-07", "2026-11-08"]) {
    assert.deepEqual(rangeFor("this weekend", { from, zone }), {
      start: "2026-11-06",
      end: "2026-11-09",
      zone,
    })
    assert.equal(rangeFor("next weekend", { from, zone }).start, "2026-11-13")
  }
})
test("year rollover and DST weekends", () => {
  assert.equal(rangeFor("next weekend", { from: "2026-12-31", zone }).start, "2027-01-08")
  const r = rangeFor("this weekend", { from: "2026-10-31", zone })
  assert.deepEqual([r.start, r.end], ["2026-10-30", "2026-11-02"])
})
const event = (id, date, completed = false) => ({
  id,
  date,
  name: "UFC Test",
  status: { type: { completed } },
  competitions: [{ competitors: [{ athlete: { displayName: "José Fighter" } }] }],
})
test("local boundaries exclude Thursday and Monday; completed events and search", () => {
  const r = rangeFor("this weekend", { from: "2026-10-31", zone })
  const raw = [
    event("thu", "2026-10-30T05:59:59Z"),
    event("fri", "2026-10-30T06:00:00Z"),
    event("sun", "2026-11-02T06:59:59Z"),
    event("mon", "2026-11-02T07:00:00Z"),
    event("done", "2026-10-31T22:00Z", true),
  ]
  assert.deepEqual(
    filterEvents(raw, r, "JOSÉ").map((e) => e.id),
    ["fri", "sun"],
  )
  assert.equal(filterEvents(raw, r, "missing").length, 0)
})
test("reference date uses selected timezone", () => {
  const now = new Date("2026-11-09T01:00Z")
  assert.equal(rangeFor("this weekend", { now, zone }).start, "2026-11-06")
  assert.equal(rangeFor("this weekend", { now, zone: "UTC" }).start, "2026-11-13")
})
test("bad input rejected", () => {
  assert.throws(() => rangeFor("schedule", { from: "2026-02-30", zone }))
  assert.throws(() => rangeFor("schedule", { days: 0, zone }))
  assert.throws(() => rangeFor("schedule", { zone: "Nonsense/Zone" }))
})
test("upstream status and malformed payload handled", async () => {
  const r = rangeFor("schedule", { zone })
  await assert.rejects(
    getEvents(r, "", async () => ({ ok: false, status: 503 })),
    /503/,
  )
  await assert.rejects(
    getEvents(r, "", async () => ({ ok: true, json: async () => ({}) })),
    /Unexpected/,
  )
})
test("request expands UTC date bounds and empty feed is valid", async () => {
  const r = rangeFor("this weekend", { from: "2026-11-02", zone })
  const result = await getEvents(r, "", async (url) => {
    assert.match(url, /dates=20261105-20261109/)
    return { ok: true, json: async () => ({ events: [] }) }
  })
  assert.deepEqual(result, [])
})
