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
