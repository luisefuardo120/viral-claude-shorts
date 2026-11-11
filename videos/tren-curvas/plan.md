# Plan: "¿Por qué el tren no se sale en las curvas?" (3D, acabado de maqueta)

**Idea:** las ruedas del tren van unidas a un eje rígido; en una curva la de fuera debe recorrer más, y lo consigue porque las ruedas son conos (conicidad). Los conos hacen bailar al tren en las rectas (se calma con poca inclinación y amortiguadores), la pestaña es el seguro en curvas cerradas y el peralte compensa el empuje hacia fuera.
**Estilo:** el del canal (`styles/3d/diorama.ts` + `theme.css`): maqueta flotante con corte de tierra, protagonistas lisos, títulos gruesos con la palabra clave en verde lima, subtítulos palabra a palabra, marca de agua @curiosferagfx.
**Prefijo de código:** `tc`.

## Reparto
- **Tren `tcTrain`** (original): dos coches blancos de morro redondeado, franja turquesa y banda de ventanas oscura, sin parecerse a ningún tren real. Coches de 9 m (más cortos que los reales, para que quepan en la maqueta). Va por la vía con `pose(s)`: cada coche se apoya en dos bogies que siguen la vía.
- **Eje montado `tcWheelset`** (protagonista, liso, a escala real: ancho de vía 1,435 m, rueda de 0,45 m de radio): eje gris y dos ruedas plateadas. Estados:
  - `taper` de 0 (cilindro) a 1 (cono exagerado para que se vea), más ancha por dentro;
  - `flange`: la pestaña (borde interior), de 0 a 1;
  - giro de las ruedas (`roll`) y desplazamiento lateral (`shift`);
  - aros de contacto: verde lima en la rueda de fuera (radio grande) y rojo en la de dentro (radio pequeño).
- **Vía `tcTrack`**: dos carriles, traviesas de madera y balasto de grava a lo largo de un recorrido: un óvalo (dos rectas de 24 m y dos curvas de 9 m de radio).
- **Tramo corto `tcRails`**: dos carriles rectos y sus traviesas, para los primeros planos.
- **Huellas `tcTrails`**: dos arcos que crecen sobre la curva: el de fuera (verde lima) más largo que el de dentro (rojo).
- **Chispas `tcSparks`**: estallido naranja en bucle donde patina la rueda.
- **Amortiguadores `tcDampers`**: dos muelles con su cilindro a los lados del eje.
- **Corte de la vía `tcCant`**: la vía de frente sobre su balasto; el carril de fuera sube (peralte) y una flecha empuja hacia fuera.

## Escenarios
- **Maqueta** de 52 × 32 m con el óvalo, colinas, casitas y árboles fuera de la vía.
- **Primeros planos** sobre la misma hierba de la maqueta, con un tramo de vía.

## Cámara
- `corner`: esquina alta de la maqueta (gancho y cierre).
- `close`: tres cuartos sobre el eje montado.
- `front`: de frente al eje (corte), para ver los radios de contacto, la pestaña y el peralte.
- `top`: cenital sobre la curva para las huellas y el baile.

## Lenguaje visual
- Verde lima = la rueda de fuera / lo que funciona; rojo = la de dentro / el problema.
- Lo que aparece lo hace con rebote; los cambios de una clave duran 0,5 s como mucho.

## Sonido
- Tempo: 100 bpm.
- Curva emocional: gancho curioso → el problema, tenso (patinar, chirriar) → descubrimiento de los conos (wonder) → otro "pero" tenso (el baile) → la solución, tranquila → la pestaña, épica → el peralte, maravilla → cierre triunfal.
- Ambiente: viento en la maqueta.
- Efectos: `scratch` en el chirrido, `shimmer` en los conos y la conicidad, `hit` cuando la pestaña choca, `pop` en las apariciones.
