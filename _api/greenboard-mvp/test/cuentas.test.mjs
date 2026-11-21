// node --test test/   (desde _api/greenboard-mvp). Funciones puras de src/cuentas.js, sin Worker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { aulasLibres, correoValido, enlaceBlackboard, parseIcs } from "../src/cuentas.js";

test("solo entran correos de alumno de U-tad", () => {
  const d = ["live.u-tad.com"];
  assert.equal(correoValido("  Ana.Garcia@LIVE.u-tad.com ", d), "ana.garcia@live.u-tad.com");
  assert.equal(correoValido("profe@u-tad.com", d), null);
  assert.equal(correoValido("x@live.u-tad.com.evil.com", d), null);
  assert.equal(correoValido("x@gmail.com", d), null);
});

test("el enlace de Blackboard tiene que ser el del calendario de U-tad", () => {
  const h = ["u-tad.blackboard.com"];
  const ok = "https://u-tad.blackboard.com/webapps/calendar/calendarFeed/abc123DEF456_x/learn.ics";
  assert.equal(enlaceBlackboard(ok + "?q=1", h), ok);
  assert.equal(enlaceBlackboard(ok.replace("https", "http"), h), null);
  assert.equal(enlaceBlackboard("https://evil.com/webapps/calendar/calendarFeed/abc123DEF456/learn.ics", h), null);
  assert.equal(enlaceBlackboard("https://u-tad.blackboard.com/ultra/calendar", h), null);
  assert.equal(enlaceBlackboard("no es una url", h), null);
});

const ICS = `BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART;TZID=Europe/Madrid:20261015T235900\r
DTEND;TZID=Europe/Madrid:20261015T235900\r
SUMMARY:Ejercicios 1\r
UID:_blackboard.platform.gradebook2.GradableItem-_218329_1\r
END:VEVENT\r
BEGIN:VEVENT\r
DTSTART:20261020T080000Z\r
DTEND:20261020T100000Z\r
SUMMARY:Examen Parcial Física\r
UID:_blackboard.data.calendar.CalendarEntry-_11111_1\r
LOCATION:Lab 2.3\r
END:VEVENT\r
BEGIN:VEVENT\r
DTSTART;TZID=Europe/Madrid:20261101T235900\r
DTEND;TZID=Europe/Madrid:20261101T235900\r
SUMMARY:Nota Final Convocatoria Extraordinaria\r
UID:_blackboard.platform.gradebook2.GradableItem-_218400_1\r
END:VEVENT\r
BEGIN:VEVENT\r
DTSTART;VALUE=DATE:20261105\r
SUMMARY:Entrega práctica 2 de Física\r
  General I\r
UID:_blackboard.platform.gradebook2.GradableItem-_218401_1\r
END:VEVENT\r
END:VCALENDAR\r
`;

test("el .ics de Blackboard se parte en entregas y eventos, como el pipeline", () => {
  const { entregas, eventos } = parseIcs(ICS);
  assert.deepEqual(entregas, [
    { id: "_218329_1", t: "Ejercicios 1", d: "2026-10-15T23:59" },
    { id: "_218401_1", t: "Entrega práctica 2 de Física General I", d: "2026-11-05T23:59" },   // línea plegada
  ]);                                                                     // la "Nota Final" no es una entrega
  assert.deepEqual(eventos, [{ id: "_11111_1", t: "Examen Parcial Física", ini: "2026-10-20T10:00",
    fin: "2026-10-20T12:00", lugar: "Lab 2.3" }]);                      // UTC -> hora de Madrid (CEST)
});

test("aulas libres: ninguna clase pisa el hueco, y se sabe hasta cuándo", () => {
  const rooms = { generated: "g", rooms: [
    { code: "BE001", building: "Edificio Berlín", name: "Aula 001", bookings: [
      { start: "2026-11-24T09:00:00+01:00", end: "2026-11-24T11:00:00+01:00" },
      { start: "2026-11-24T17:00:00+01:00", end: "2026-11-24T19:00:00+01:00" }] },
    { code: "BE002", building: "Edificio Berlín", name: "Aula 002", bookings: [
      { start: "2026-11-24T10:30:00+01:00", end: "2026-11-24T12:00:00+01:00" }] },
    { code: "MA04", building: "Otros", name: "MA04", bookings: [] }] };
  const r = aulasLibres(rooms, "2026-11-24", "11:00", "13:00");
  assert.equal(r.conDatos, true);
  assert.deepEqual(r.libres.map((x) => [x.aula, x.hastaLas]), [["Aula 001", "17:00"], ["MA04", null]]);
  assert.equal(aulasLibres(rooms, "2027-01-10", "11:00", "13:00").conDatos, false);
});
