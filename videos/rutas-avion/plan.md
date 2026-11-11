# Plan: "¿Por qué los aviones no vuelan en línea recta en el mapa?" (3D, acabado de maqueta)

**Idea:** la raya recta de un mapa plano no es el camino más corto; sobre la bola, la recta de verdad (el círculo máximo) se curva hacia el polo, y además los aviones aprovechan o esquivan las corrientes en chorro.
**Referencia de estilo:** el video del cable del tren: maqueta flotante con el corte de tierra, protagonistas lisos y redondeados, fondo facetado, cielo azul, títulos gruesos en mayúsculas con contorno (palabra clave en verde lima, cifras en rojo) y subtítulos palabra a palabra en el centro.
**Marca de agua:** @curiosferagfx (la pone `core/mix.ts` en `final.mp4`).
**Prefijo de código:** `ra`.

## Reparto
- **Avión `raPlane`** (protagonista, liso): avión de pasajeros genérico de unos 12 m, fuselaje blanco torneado, franja y cola azules, ventanillas, dos motores, tren de aterrizaje que se recoge. Sin colores de ninguna aerolínea. Estados: `parked` (en pista), `climb` (despega y sube; el tren se recoge en 0,5 s), `cruise` (vuela con un leve balanceo).
- **Mini avión `raPlaneIcon`**: el mismo avión a escala, sobre el globo y el mapa; sigue una ruta con el morro en la dirección de la marcha.
- **Tierra `raEarth`** (protagonista, lisa): una sola pieza que **se transforma** entre globo (radio 3 m) y mapa plano de Mercator (`morph` de 0 a 1). Océano azul, continentes verdes y Groenlandia blanca, todos de contornos sencillos. Centrada en el Atlántico Norte.
  - Pines: Londres y Los Ángeles (gota roja con punta).
  - Rutas: la **raya** del mapa (recta de Mercator, roja) y el **hilo** (círculo máximo, verde lima); las dos crecen de una ciudad a la otra en 0,5 s y siguen a la Tierra al transformarse.
  - **Anillo del círculo máximo**: disco translúcido que corta el globo por su centro y pasa por las dos ciudades.
  - **Corrientes en chorro**: trazos blancos alargados que dan la vuelta al globo entre 40° y 60° N, de oeste a este y en bucle.
- **Groenlandia contra África `raCompare`**: las dos siluetas planas, una al lado de la otra, al tamaño de Mercator; en la clave, Groenlandia encoge a su tamaño real (África 14 veces mayor).
- **Barras de ida y vuelta `raBars`**: dos barras de tiempo con su mini avión: la vuelta, más larga.

## Escenarios
- **Aeródromo-maqueta `raDiorama`**: bloque de tierra flotante de 46 × 28 m con el corte en capas, pista de asfalto, casitas de tejado rojo, árboles redondos, colinas facetadas y matas de hierba.
- **Cielo**: azul (`#5bb8f5`), nubes redondas y sol; para el crucero, nubes que pasan.
- **Espacio claro**: el globo flota sobre el cielo azul con nubes lejanas, para que todo el video sea luminoso.

## Cámara
- `corner`: esquina de la maqueta, alta, deslizándose despacio (gancho).
- `globe`: frente al globo, con un pequeño empuje; el globo gira despacio en bucle.
- `map`: frente al mapa plano, encuadrando de Los Ángeles a Londres.
- `chase`: detrás y al lado del avión en vuelo.

## Lenguaje visual
- Rojo = la raya del mapa (lo que parece); verde lima = el hilo, la recta de verdad.
- Lo que aparece lo hace con rebote (`p3Spring`); las rutas crecen en 0,5 s.
- Subtítulos de 1 o 2 palabras en el centro (y≈1130), con el mismo estilo de los títulos.

## Sonido
- Tempo: 96 bpm.
- Curva emocional: gancho curioso → el "pero" con tensión → descubrimiento (wonder) en la bola y el hilo → el pico épico en "14 veces" y "círculo máximo" → energía con el viento → cierre triunfal.
- Ambiente: viento en el aeródromo y en vuelo.
- Efectos: `whoosh` cuando crece una ruta o pasa el avión, `pop` en los pines, `impact` en las cifras, `shimmer` en el círculo máximo.
