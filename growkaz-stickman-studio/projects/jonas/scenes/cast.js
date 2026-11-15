// cast.js — one outfit per recurring character. Signature colour = identity; keep it identical in every shot.
// Jonás: ochre robe + cream turban (the turban is drawn by jonas()/bigJonas() in sets/world.js). Original design.
export const JONAS = { top: 'dress', color: '#d0802f', head: 'none' };
// the sailor who speaks for the crew: navy shirt + red woollen cap
export const SAILOR = { top: 'tshirt', color: '#3a6ea5', head: 'beanie', headColor: '#d64a33' };
// the rest of the crew: plain ink
export const CREW = { top: 'none', head: 'none' };
export const CAST = [JONAS, SAILOR];
