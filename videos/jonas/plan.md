# Jonás y el gran pez: plan del mundo (3D)

**Idea:** puedes huir de Dios, pero Dios nunca huye de ti. Es una historia bíblica animada de 46 s para "Cerca de ti" (serie "Historias de la Biblia").
**Tono:** cálido, de cuento, low-poly mate. El héroe de cada plano lleva textura: el pez (piel con manchas y pliegues), la madera del barco, el mar con olas y la carne del interior. Todo lo demás es simple.

## Reparto

### Jonás (`jnPerson(JN_JONAS)`): original, textura simple
- Un hombre de ~1.85 m, con túnica ocre, faja granate, barba oscura y un turbante crema con banda granate. Es un diseño propio y no copia ningún personaje existente.
- Esqueleto: pelvis → torso (se inclina) → cuello → cabeza (asiente). Hombros (giran adelante y a los lados) → codos (doblan solo hacia delante) → manos. Caderas (adelante y atrás) → rodillas (doblan solo hacia atrás) → pies con sandalias.
- Proporciones: el pecho es más ancho que la cintura, la falda de la túnica es acampanada y brazos y piernas se afinan hacia la punta.
- **Estados** (se cambia entre ellos con una mezcla de 0.25 a 0.4 s):
  - `stand`: de pie, tranquilo.
  - `walk`: ciclo de caminar a partir de t.
  - `scared`: manos arriba y cuerpo hacia atrás (miedo).
  - `heart`: mano derecha al pecho y cabeza baja (culpa).
  - `pray`: de rodillas, manos juntas frente al pecho y cabeza baja.
  - `kneelPraise`: de rodillas, brazos arriba en V y cara hacia arriba.
  - `praise`: de pie, brazos en V.
  - `fall`: brazos abiertos y piernas sueltas (el giro lo pone el plano).
  - `float`: flotando bajo el agua.
  - `point`: brazo derecho extendido al frente.

### Marineros (`jnPerson(JN_SAILOR)`)
- El mismo esqueleto que Jonás, con túnica azul grisácea, gorro rojo y sin turbante. Estados: `stand` y `scared`.

### El gran pez (`jnFish()`): héroe con textura
- Mide unos 12 m (unas 6.5 personas). El cuerpo es una forma orgánica: dorso azul pizarra con manchas claras, vientre blanco azulado con pliegues, ojo grande y aleta caudal vertical. Tiene mandíbula inferior con bisagra y boca interior granate.
- **Estados:** `swim` (la cola y las aletas oscilan con t); `open` de 0 a 1 (baja la mandíbula: aparece la boca roja y, en el gancho, una luz cálida dentro); `closed`.

### Barco (`jnBoat()`)
- Casco de madera con tablas (textura), cubierta, mástil, verga y vela cuadrada crema con dos franjas rojas. Mide unos 6.5 m.
- **Estados:** `sail` (balanceo suave) y `storm` (balanceo fuerte), mezclados con un valor de 0 a 1. Con `fill` de 0 a 1 la vela se hincha.

### Nínive (`jnCity()`)
- Una muralla de adobe con almenas, torres redondas, una puerta oscura y un zigurat de 3 pisos. Siempre se ve lejos.
- **Estado:** `glow` de 0 a 1 la ilumina en dorado: "este es el destino".

## Escenarios
1. **Mar abierto** (`jnSurface`): mar con olas (sombreado por altura y espuma), nubes y niebla en el horizonte. Con `storm` de 0 a 1: cielo gris pizarra, olas 4 veces más altas, mar oscuro, nubes oscuras y lluvia. Con un rayo: destello y relámpago quebrado. Movimiento propio: olas y lluvia.
2. **Bajo el agua** (`jnUnder`): azul profundo con niebla, rayos de luz desde la superficie, burbujas que suben, fondo de arena y rocas.
3. **Dentro del pez** (`jnBelly`): túnel de carne granate (textura con venas), costillas color marfil en anillos y un suelo líquido brillante. Hay poca luz cálida. Con `heard` de 0 a 1 baja un haz dorado y aparecen chispas.
4. **Costa al amanecer** (`jnCoast`): arena, mar a la izquierda, palmeras, rocas, sol bajo detrás de Nínive y cielo de melocotón.

## Cámara (dentro del área segura, el sujeto entre y 600 y y 1500)
- `hookUnder`: el pez viene de frente en tres cuartos y la cámara se acerca despacio.
- `callWide`: detrás de Jonás, con Nínive al fondo.
- `sailSide`: tres cuartos del barco, con un vaivén leve.
- `stormWide`: más baja, con temblor (determinista, a partir de t).
- `deckClose`: cerca de la cubierta.
- `underSide`: Jonás se hunde y el pez sube desde abajo a la izquierda.
- `bellyPush`: frontal, se acerca a Jonás de rodillas.
- `shoreThree`: tres cuartos de la orilla.
- `followBack`: detrás de Jonás caminando hacia Nínive.
- `craneUp`: sube y se aleja, mostrando todo.

## Lenguaje visual
- **Haz de luz dorado** (`jnBeam`): Dios habla o escucha. Aparece en 0.4 s.
- **Flecha 3D** (`p3Arrow`): dorada hacia Nínive (la misión) y roja hacia el lado contrario (la huida). Crece con un rebote de 0.4 s.
- **Salpicadura** (`jnSplash`): gotas blancas en parábola durante 1.2 s.
- **Rayo**: destello de 0.35 s con relámpago.

## Sonido
- Música a 84 BPM en D.
- Curva emocional: misterio (gancho) → calma con asombro (el llamado) → tensión (la huida) → oscuro (la tormenta) → tensión (la culpa) → épico (el pez) → triste (la oscuridad) → asombro (el tercer día) → triunfal (la lección y el cierre).
- Ambiente: viento en el mar y la tormenta.
- Efectos: `hit` para la cifra, `pop` cuando se abre la boca, `whoosh` en la huida, `impact` en el rayo y en el pez, `whoosh` al caer al mar, `shimmer` cuando Dios escucha y en "nunca", `thump` cuando Jonás cae en la arena.
