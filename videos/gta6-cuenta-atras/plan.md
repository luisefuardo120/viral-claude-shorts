# Plan: "5 cosas que sabemos de GTA 6" (3D)

**Idea:** quedan días para GTA 6; cinco datos confirmados contados rápido, con un dúo de criminales ORIGINAL como presentadores.
**Regla de propiedad:** la narración nombra a Lucía, Jason, Vice City y Leonida, pero no se dibuja nada del juego: ni sus personajes, ni su logo, ni su ciudad, ni la forma de las consolas reales ni el botón rojo de YouTube. Todo lo que se ve es diseño propio.
**Prefijo de código:** `g6`.

## Reparto
Escala: una persona = 1,75 m (como una puerta). Esqueleto con articulaciones visibles (bolas) en cuello, hombros, codos, muñecas, cintura, caderas, rodillas y tobillos. Extremidades que se afinan hacia abajo y pecho más ancho que la cintura. Todo es simple (low-poly mate); en este video nada lleva textura, para que renderice rápido.

- **Nia** (heroína, ~1,78 m, delgada): moño alto de rizos color cobre (`#b5532b`), piel morena (`#8d5a3c`), cortavientos verde lima (`#a4d65e`) con cremallera blanca, pantalón azul marino (`#22305a`) y zapatillas blancas. Ojos como dos puntos oscuros.
- **Rocco** (compañero, ~1,72 m, ancho, factor de anchura 1,2): cabeza rapada, piel clara (`#e0a882`), gafas de sol redondas negras, chándal coral (`#ff6f61`) con raya blanca en brazos y piernas, sin barba, zapatillas negras.
  - Comprobado: ninguno se parece a los protagonistas del juego (pelo oscuro y camiseta de tirantes / barba y camisa); usan paletas lima/coral, y los dos llevan zapatillas.
- **Coche g6Car**: descapotable de dos plazas inventado, verde azulado (`#1fb5a8`) con interior crema, faros redondos y ruedas negras con tapacubos plateado; 4,2 m de largo (como un coche pequeño). Dos asientos para Nia y Rocco.
- **Calendario g6Calendar**: bloque de sobremesa con tres hojas: "OTOÑO 2025", "26 MAYO 2026" y "19 NOV 2026". Las dos primeras llevan una X roja de "retrasado".
- **Mapa g6Map**: península tropical low-poly (inspirada en Florida, pero sin rótulos reales) en un mar azul, arena alrededor, luces de ciudad en la costa sureste y un pin rojo.
- **Pantalla g6Screen**: pantalla gigante de cartel 16:9 con un botón de reproducir genérico (círculo blanco con triángulo, nunca la marca de YouTube) y barras que crecen como audiencia.
- **Consolas g6Consoles**: dos consolas genéricas (losa azul pizarra con luz cian; cubo carbón con luz ámbar) y una torre de PC con ventilador. Encima aparecen un ✓ verde (consolas) y una ✗ roja (PC).
- **Medalla g6Badge(n)**: moneda amarilla con el número del dato (1 a 5).

## Estados
- **Personas** (cambio en 0,4 s, por mezcla de poses): `idle` (respira), `wave` (saluda con la mano), `point` (señala al frente), `cheer` (brazos arriba y saltitos), `think` (mano en la barbilla), `walk` (ciclo de paso), `sit` (sentada al volante).
- **Coche**: `parked` (aparcado) y `driving` (ruedas girando y un leve bote); `lights` (faros encendidos: brillo).
- **Calendario**: hoja 1 → (k1: X roja + hoja que vuela) → hoja 2 → (k2: lo mismo) → hoja 3 brilla.
- **Mapa**: el pin cae con rebote en `pin`; las luces de la ciudad laten en bucle.
- **Pantalla**: apagada → `play` (se enciende y el botón aparece) → `viral` (las barras crecen y la pantalla late).
- **Consolas**: `check` (aparece el ✓ con rebote), `no` (la ✗ sobre el PC y su ventilador se apaga).
- **Medalla**: aparece en `pop` con rebote y gira despacio.

## Escenarios
- **g6Street, calle tropical al atardecer**: asfalto con línea discontinua, aceras, fila de edificios pastel bajos (rosa, menta, lavanda, melocotón) con tiras de neón cian y rosa, palmeras. Cielo de atardecer (`#f7a07a`). Movimiento ambiente en bucle: los neones parpadean suave y las palmeras se mecen.
- **Estudio oscuro** (calendario, pantalla, consolas): fondo azul noche (`C3.night`), suelo morado oscuro, luz cálida.
- **Mar** (mapa): fondo azul cielo, agua.

## Cámara
- `wide`: calle en tres cuartos, a 16 m, deslizándose despacio.
- `duo`: plano medio de los dos personajes a 7 m, con un pequeño empuje hacia dentro.
- `orbit`: giro lento alrededor de un objeto (mapa, calendario, consolas).
- `push`: acercamiento frontal a la pantalla.
Todos dejan al sujeto entre y 600 y 1500, dentro de la zona segura.

## Lenguaje visual
- Medalla con número al empezar cada dato (rebote de 0,4 s).
- Aparición con rebote (`p3Spring`) para todo lo que entra en escena.
- ✓ verde = confirmado; ✗ roja = no / retrasado.

## Sonido
- Tempo único: 100 bpm.
- Curva emocional: gancho con intriga → datos con energía → récord del tráiler (el pico) → consolas con un giro → cierre cálido y cercano.
- Ambiente: ciudad de noche en la calle.
- Efectos: un "pop" en cada medalla, un golpe en la X del calendario y un "ding" en el ✓.
