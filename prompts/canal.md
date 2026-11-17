# Canal @curiosferagfx: la fórmula

Sacada del análisis de noviembre de 2026 (canales en español @hecho.aproposito y @XEngineeringXE, y @zackdfilms en inglés). Úsala para elegir el tema, escribir el guion y publicar cada video.

## Tema
- Algo que todo el mundo **ve** y nadie entiende: un objeto o detalle de la calle, la carretera, el tren, el avión o el barco ("el cable en zigzag", "las piedras de la rampa", "las piezas con patas del rompeolas"). Son los que pasan del millón.
- Nada de curiosidades generales (animales, cuerpo, historia): ahí compite Zack D. Films, que YouTube dobla al español.
- Antes de elegir, comprobar que @hecho.aproposito no lo ha hecho ya.

## Guion (45–60 s, 130–200 palabras)
- Gancho: la pregunta, tal cual.
- Cadena: problema → "entonces" (solución) → "eso es X" (el nombre) → "pero…" (otro problema) → giro final.
- Cierre: vuelve a la pregunta del principio (invita a verlo otra vez).
- Una cifra sorprendente y comprobable, si la hay. Nada sin comprobar.

## Imagen
- Estilo maqueta del canal: `styles/3d/diorama.ts` + `theme.css` (títulos gruesos, palabra clave en verde lima, cifras en rojo, subtítulos palabra a palabra).
- Protagonista con muchas piezas pequeñas; lupas para los detalles; cámara con movimiento.
- Marca de agua @curiosferagfx (la pone `core/mix.ts`).

## Voz
- ai33, voz Fish Audio `fishaudio_5e95c590cfcb46ab927a9ec7b35a88c7`, una sola toma (~1.000–1.300 créditos).

## Publicación (YouTube Shorts, TikTok, Reels)
- Título: la pregunta + un emoji. Ej.: `¿Por qué el cable de los trenes va en zigzag? ⚡`
- Descripción: 2 frases (el misterio + la pista de la respuesta) y una pregunta al público.
- Hashtags: `#shorts` + 4–5 del tema (`#ingenieria #curiosidades #ciencia #comofunciona` + el concreto).
- Primer comentario fijado: "¿Qué tema quieres que explique en el próximo video? 👇"
- 4–5 videos por semana, separados unas horas. A las 48 h: % visto hasta el final (>70 % es bueno) y vistas.

## Mejora continua (después de cada render)
Cada video tiene que salir mejor que el anterior. Al terminar el render:
1. Mirar el video terminado escena por escena: la hoja de contactos `videos/<tema>/review/sheet.jpg` y fotogramas sueltos de `final.mp4` (con `ffmpeg -ss`).
2. Comparar con el video de referencia (el del cable del tren) y con los éxitos actuales (@stupy_doo, @hecho.aproposito).
3. Escribir en el registro de abajo qué se puede mejorar (3–5 puntos concretos: encuadre, detalle, movimiento, claridad de la explicación, ritmo) y decírselo al usuario.
4. Aplicar esas mejoras en el siguiente video; si son del estilo del canal, en `styles/3d/diorama.ts` para que lleguen a todos.

### Registro de mejoras
- **bulbo-proa:** siempre hay suelo (puerto en maqueta); espuma blanca en las crestas para que las olas se lean; las curvas de la explicación se dibujan por encima del agua.
- **eje-camion:** nada entre la cámara y el protagonista (los adornos van detrás); exagerar el movimiento clave para que se note (el eje sube 60 cm).
- **agujero-ventanilla:** fórmula "NO está de adorno"; marca de agua bajo los subtítulos; interiores con objetivo abierto (fov 50+) y llenos de detalles (paredes de dos tonos, luz ambiental, moqueta con patrón).
  - *Para el siguiente (revisión del video terminado):* 1) más color: casi todo era gris, blanco y azul pálido; cada pieza clave con su color fuerte. 2) gancho más fuerte: el primer segundo debe enseñar el objeto grande y claro, no una pared; una mano o un dedo señalándolo. 3) etiquetas sobre las piezas cuando se separan (EXTERIOR, MEDIO, INTERIOR). 4) más movimiento de cámara: acercamientos y giros en cada escena, nunca planos quietos. 5) cifras más grandes y con rebote.
- **puntos-parabrisas:** aplicado: color fuerte por pieza, gancho con el objeto grande y una mano que lo toca, etiquetas (`dioLabel`), cámara en movimiento.
  - *Para el siguiente (revisión del video terminado):* 1) demasiados planos casi iguales: 8 de 11 escenas eran el mismo frontal del parabrisas; alternar planos (general, detalle, lateral, desde dentro). 2) la mitad de abajo del encuadre era carrocería lisa: lo que explicas va en el centro y abajo también tiene que pasar algo. 3) más acción física: que las cosas se muevan de verdad (el cristal se despega y cae, el sol cruza), no solo cambios de color. 4) las etiquetas, más grandes y con flecha a la pieza. 5) el plano del sol perdía el coche: el protagonista siempre en cuadro.
- **bolita-cargador:** aplicado: planos variados (cambio de plano a mitad de escena), toda la imagen con vida (escritorio lleno), acción física (tapa que se abre, bolita que se desliza y se parte), etiquetas grandes con flecha (`dioLabel(..., true)`).
  - *Para el siguiente (revisión del video terminado):* 1) la tapa del cargador quedó flotando torcida: revisar que las piezas que se mueven encajen. 2) la etiqueta CORRIENTE se cortaba en el borde: etiquetas siempre dentro de x 120–960. 3) la escena larga del ruido (8 s) repetía casi el mismo plano: en escenas de más de 5 s, dos planos claramente distintos. 4) el plano final se veía lejano y plano: cerrar con un plano cercano del protagonista y un movimiento de cámara amplio. 5) la parte de abajo del encuadre volvió a quedar vacía (madera lisa) en los planos generales.

- **hoyo-piscina:** estilo del short del refugio (corte del terreno, obrero 2D `Toon` con gorra azul y chaleco naranja, una palabra grande de color, barra "DE HOYO ▬ PISCINA"); pasos numerados en voz y en pantalla; premio comparado con algo de casa (≈ 300 bañeras); marca de agua sutil en Lemon.
  - *Para el siguiente (revisión del video terminado):* 1) la palabra blanca sobre el agua celeste casi no se lee: subtítulo con contorno más grueso o caja oscura cuando el fondo es claro. 2) el obrero queda cortado en el borde en los planos de la piscina llena: colocarlo siempre dentro de x 120–960. 3) los tubos (paso 2) apenas se ven bajo la jaula: ocultar o atenuar el acero mientras se presentan. 4) agua que se llena sin movimiento en la superficie: añadir ondas o un chorro visible. 5) cuatro escenas seguidas con el mismo plano de la piscina llena (paso 5 → premio → pregunta): variar con un plano cenital o a ras de agua.
- **Pedido del canal (para el siguiente):** más detalle y más atmósfera de fondo: el fondo no puede ser solo casa + valla + cielo plano. Capas de profundidad (vecinos, árboles a varias distancias, montañas o ciudad lejana con niebla), cielo con degradado y nubes que se mueven, luz de hora del día (sol bajo, sombras largas), vida en el fondo (pájaros, ropa tendida, perro, coche que pasa) y detalles en el suelo (flores, piedras, macetas, herramientas).
