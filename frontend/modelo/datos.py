"""
Datos de entrenamiento del moderador de Green Community.

Cada plantilla genera varios ejemplos rellenando {X} (persona), {asig}, {juego}, {lugar} y {dia}.
Etiquetas: ok (se publica), revisar (lo mira Vida universitaria), bloquear (no se publica).

Son datos SINTÉTICOS escritos por el equipo: sirven para el MVP. Para producción habría que
añadir anuncios reales etiquetados (los que revise Vida universitaria en el panel de moderación).
Para mejorar el modelo: añade plantillas aquí y vuelve a ejecutar `python entrenar.py`.
"""
import random

PERSONAS = ['Hugo', 'Pablo', 'Lucía', 'Marta', 'Juan', 'Víctor', 'Sara', 'Leo', 'Nerea', 'Álvaro', 'Irene', 'Carla',
            'Iván', 'Ana', 'Dani', 'Elena', 'la de primero', 'el de segundo', 'el profe de Física', 'la nueva de clase']
ASIGS = ['Análisis', 'Optimización', 'Física', 'Programación', 'Estadística', 'Bases de datos', 'Álgebra', 'Animación']
JUEGOS = ['GTA VI', 'LoL', 'Valorant', 'FIFA', 'Pokémon', 'Mario Kart', 'Fortnite', 'Call of Duty', 'Minecraft', 'Elden Ring']
LUGARES = ['la cafetería', 'la biblioteca', 'el aula 104', 'la cancha', 'el parque', 'el Retiro', 'Discord', 'casa de Hugo', 'el aula de videojuegos']
DIAS = ['el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el finde', 'mañana', 'esta tarde', 'a mediodía']

OK = [
    'Pachanga de fútbol sala {dia}, faltan 3', 'Busco pareja para jugar al pádel {dia}', 'Partido de pádel, somos 2 y buscamos rivales',
    'Fútbol sala a mediodía, nivel tranquilo', 'Torneo de futbolín en {lugar}', 'Quedada para estudiar {asig} en {lugar}',
    'Repaso de {asig} antes del examen', 'Grupo de estudio para la práctica de {asig}', 'Comparto mis apuntes de {asig}',
    'Dudas de {asig}, nos juntamos {dia} en {lugar}', 'Partidas de {juego} online {dia}', 'Busco gente para jugar al {juego}',
    'Golpes y tiroteos en {juego} online', 'Matar zombis en el modo historia', 'Misiones de {juego} con micro por Discord',
    'Carreras en {juego} en {lugar}', 'Ranked de {juego}, nos falta el support', 'Torneo de {juego} en {lugar}',
    'Combates e intercambios Pokémon en {lugar}', 'Atracos en GTA VI con gente de la uni', 'Disparos y explosiones en {juego}, quien se apunte',
    'Partida de cartas en {lugar}', 'Café en {lugar} para conocer gente de primero', 'Acuarela en el Retiro {dia}',
    'Sketching de figura en {lugar}', 'Visita al Prado {dia}', 'Salida a dibujar al parque', 'Feedback de portfolio en {lugar}',
    'Ver la final del Mundial en {lugar}', 'Ir al cine {dia}, ¿quién se apunta?', 'Comida en el Burger de al lado {dia}',
    'Correr 5 km por el campus {dia}', 'Clase de yoga en {lugar}', 'Ruta en bici por la sierra {dia}', 'Ajedrez en {lugar} a mediodía',
    'Montar un grupo de música, busco batería', 'Jam de videojuegos {dia}, buscamos artista 2D', 'Hackathon de la uni, nos falta un backend',
    'Ayuda con la práctica de Programación', 'Hacemos el trabajo de grupo en {lugar}', 'Quien venga que traiga su portátil',
    'Pachanga mixta de tarde, todos los niveles', 'Revancha 4.º contra 3.º en la cancha', 'Busco compañero para el torneo de pádel',
    'Partida de rol {dia} en {lugar}', 'Club de lectura: este mes una novela corta', 'Paga quien pierda la pista de pádel, 5 euros',
    'Invito a la pista, faltan 3', 'Asesinatos en el modo historia de {juego}', 'Matar al jefe final de Elden Ring entre todos',
    'Quedamos para ver anime {dia}', 'Intercambio de idiomas inglés y español en {lugar}', 'Pintar un mural en la uni {dia}',
    'Taller de fotografía por el campus', 'Speedrun de Mario Kart en {lugar}', 'Partido amistoso contra otra universidad',
]

REVISAR = [
    'Apostamos 10 euros al {juego}', 'El que pierda paga 20 euros a cada uno', 'Porra del partido a 5 euros', 'Apuestas en el torneo de {juego}',
    'Botellón en el parque después de clase', 'Cervezas y chupitos en {lugar} {dia}', 'A ponernos finos esta noche', 'Fiesta con barra libre en casa de {X}',
    'Busco gente para copiar en el examen de {asig}', 'Vendo las respuestas del parcial de {asig}', 'Hago tus prácticas de {asig} por dinero',
    'Pásame el trabajo y lo entrego como mío', 'Os paso el examen de {asig} de este año antes de que lo hagáis',
    'Vendo apuntes de {asig} por bizum', 'Vendo entradas para el concierto', 'Vendo mi cuenta de {juego} con skins',
    'Dibujo de desnudo artístico en {lugar}', 'Escribidme por privado para el plan', 'Vamos a colarnos en la fiesta de otra uni',
    'Saltarnos la clase de {asig} para jugar', 'Quien quiera emborracharse que venga',
]

BLOQUEAR = [
    # burla, acoso o humillación a una persona concreta
    'Vamos a reírnos de {X} en {lugar}', 'A ver quién humilla antes a {X}', '{X} es un pringado, todos a por él',
    'Vamos a hacerle la vida imposible a {X}', 'Grabamos a {X} en el vestuario y lo subimos', 'Fotos de {X} para meternos con ella',
    'Quedada para hacerle bullying a {X}', 'Todos a reírnos de lo gorda que está {X}', 'Hacemos memes de {X} y los pasamos por el grupo',
    'Vamos a dejar en ridículo a {X} delante de todos',
    # contenido sexual
    'Esta noche a por las de primero, que están buenas', '{X} está tremenda, a ver si cae', 'Busco follamigo para {dia}',
    'Quedada para ligar y lo que surja en el baño', 'Quien quiera sexo que me escriba', 'Pásame fotos tuyas sin ropa',
    'Busco chica para pasar la noche en mi casa', 'Folla conmigo y con {X}', 'A ver quién se lía con {X} esta noche', 'Nudes a cambio de apuntes',
    # amenazas y violencia real
    'Voy a partirle la cara a {X}', '{X} se va a enterar a la salida', 'A la salida a por {X}', 'Le vamos a dar una paliza a {X}',
    'Voy a matar a {X} cuando lo vea', 'Esperamos a {X} en el parking para darle', 'Quien quiera pegarse con {X} que venga a la cancha',
    # insultos y odio
    'Pachanga solo para los que no sean subnormales', '{X} es gilipollas y no viene', 'Nada de moros ni panchitos en el equipo',
    'Aquí no queremos maricones', 'Las tías no saben jugar, solo tíos',
    # drogas con eufemismos
    'Que alguien traiga algo para fumar, ya me entendéis', 'Pillamos material para el finde', 'Fumamos unos petas en el parking',
    'Quien tenga hierba que venga a {lugar}', 'Algo para animar la fiesta, ya sabéis de qué hablo', 'Vendo maría buena y barata',
    'Unas rayas antes de la fiesta', 'Pastillas para el festival, escribidme',
]


def generar(plantillas, etiqueta, rng, por_plantilla=8):
    filas = []
    for i, p in enumerate(plantillas):
        vistos = set()
        for _ in range(por_plantilla * 3):
            t = p.format(X=rng.choice(PERSONAS), asig=rng.choice(ASIGS), juego=rng.choice(JUEGOS), lugar=rng.choice(LUGARES), dia=rng.choice(DIAS))
            if t not in vistos:
                vistos.add(t)
                filas.append((t, etiqueta, f'{etiqueta}-{i}'))
            if len(vistos) >= por_plantilla:
                break
    return filas


def datos(semilla=7):
    rng = random.Random(semilla)
    return generar(OK, 'ok', rng) + generar(REVISAR, 'revisar', rng) + generar(BLOQUEAR, 'bloquear', rng)
