// node --test test/   (desde _api/greenboard-mvp). Funciones puras de src/cuentas.js, sin Worker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { aulasLibres, codigosDe, conflictosDeGrupos, correoValido, enlaceBlackboard, parseIcs, tocaSesion } from "../src/cuentas.js";

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

test("conflictos: la misma asignatura en grupos con horarios distintos", () => {
  const datos = { groups: { FIIS4A: "FIIS4A", INSO3D: "INSO3D" }, sessions: [
    { cod: "PRO3", asig: "Proyectos III", g: ["FIIS4A"], d: "2026-11-24", h: "15:00", f: "17:00", aula: "113" },
    { cod: "PRO3", asig: "Proyectos III", g: ["INSO3D"], d: "2026-11-24", h: "09:00", f: "11:00", aula: "205" },
    { cod: "FIGI", asig: "Física General I", g: ["FIIS4A"], d: "2026-11-23", h: "11:00", f: "13:00", aula: "112" },
  ] };
  const c = conflictosDeGrupos(datos, ["FIIS4A", "INSO3D"]);
  assert.deepEqual(c.map((x) => x.clave), ["PRO3"]);
  assert.deepEqual(c[0].opciones.map((o) => o.grupo), ["FIIS4A", "INSO3D"]);
  assert.deepEqual(c[0].opciones[0].muestras[0], { d: "2026-11-24", h: "15:00", f: "17:00", aula: "113" });
  assert.equal(conflictosDeGrupos(datos, ["FIIS4A"]).length, 0);
});

test("conflictos: mismo horario en dos grupos no es conflicto", () => {
  const datos = { sessions: [
    { cod: "FIGI", asig: "Física General I", g: ["A"], d: "2026-11-23", h: "11:00", f: "13:00" },
    { cod: "FIGI", asig: "Física General I", g: ["B"], d: "2026-11-24", h: "11:00", f: "13:00" },
  ] };
  assert.equal(conflictosDeGrupos(datos, ["A", "B"]).length, 0);
});

test("códigos: sueltos (se ligan al usarlos) o con correo asignado", () => {
  const c = codigosDe({ INVITE_CODES: " dmitrii-7k2:Dmitry.Puntusov@live.u-tad.com , gb-abc ,, " });
  assert.deepEqual(c, [
    { codigo: "dmitrii-7k2", correo: "dmitry.puntusov@live.u-tad.com" },
    { codigo: "gb-abc", correo: "" },
  ]);
});

test("tocaSesion: la asignatura elegida manda sobre el resto de grupos", () => {
  const sesion = { cod: "PRO3", g: ["INSO3D"] };
  assert.equal(tocaSesion(sesion, ["FIIS4A", "INSO3D"], {}), true);
  assert.equal(tocaSesion(sesion, ["FIIS4A", "INSO3D"], { PRO3: "FIIS4A" }), false);
  assert.equal(tocaSesion({ cod: "PRO3", g: ["FIIS4A"] }, ["FIIS4A", "INSO3D"], { PRO3: "FIIS4A" }), true);
});
