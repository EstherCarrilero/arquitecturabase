function Juego() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game',
        backgroundColor: '#5c94fc',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 800 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    let game, player, otroJugador, platforms, cursors;
    let codigo;
    let playerFacing = 'right'; // Dirección del jugador
    let jumpPressed = false; // Control de salto
    let reboteEnemigo = false; // Flag para evitar limitación de velocidad tras pisar enemigo
    let playerIndicator; // Indicador visual de dirección - DEPRECADO (ahora en clase Jugador)
    let bloques, tubos, monedas, escaleras; // Elementos del nivel
    let bloquesRompibles; // Bloques que se rompen al golpear desde abajo
    let bloquesPregunta; // Bloques de pregunta que sueltan ítems
    let goombas; // Enemigos Goomba
    let plantasPirana; // Enemigos Planta Piraña
    let koopas; // Enemigos Koopa (tortugas)
    let caparazonesGroup; // Grupo Phaser para caparazones (sprites)
    let champinones; // Power-ups de champiñón
    let jugadorGrande = false; // Estado del jugador (pequeño/grande) - DEPRECADO (ahora en clase Jugador)
    let otroJugadorGrande = false; // Estado del otro jugador - DEPRECADO (ahora en clase OtroJugador)
    let puntuacionJugador = 0; // Monedas recogidas por mi jugador
    let puntuacionOtro = 0; // Monedas recogidas por el otro jugador
    let vidasJugador = 3; // Vidas del jugador principal - DEPRECADO (ahora en clase Jugador)
    let vidasOtro = 3; // Vidas del otro jugador
    let textoMiPuntuacion, textoOtroPuntuacion; // Textos en pantalla
    let textoMiVidas, textoOtraVidas; // Textos de vidas
    let otroJugadorTarget = {x: 100, y: 450}; // Posición objetivo del otro jugador - DEPRECADO (ahora en clase OtroJugador)
    let ultimaPosicionRecibida = 0; // Timestamp de última actualización - DEPRECADO (ahora en clase OtroJugador)
    let ultimaPosicionOtro = {x: 100, y: 450}; // Última posición conocida para calcular velocidad - DEPRECADO (ahora en clase OtroJugador)
    let camara; // Referencia a la cámara principal
    let invulnerable = false; // Flag de invulnerabilidad temporal - DEPRECADO (ahora en clase Jugador)
    let tiempoInvulnerabilidad = 0; // Timestamp de invulnerabilidad - DEPRECADO (ahora en clase Jugador)
    
    // Instancias de las clases
    let jugadorPrincipal;
    let jugadorRemoto;
    let listaKoopas = []; // Array de instancias Koopa
    let listaCaparazones = []; // Array de instancias Caparazon

    this.iniciar = function(codigoPartida) {
        codigo = codigoPartida;
        console.log("Iniciando juego Phaser con código de partida:", codigo);
        
        // Configurar listeners de WebSocket ANTES de crear el juego
        configurarListenersWS();
        
        game = new Phaser.Game(config);
    };
    
    // Función pública para actualizar el tamaño del otro jugador
    this.actualizarOtroJugadorGrande = function(grande) {
        if (jugadorRemoto) {
            jugadorRemoto.actualizarTamaño(grande);
            console.log("Otro jugador actualizado - Grande:", grande);
        }
    };

    function preload() {
        // Por ahora sin assets externos, usaremos formas geométricas
        console.log("Phaser: preload");
    }

    function create() {
        console.log("Phaser: create");
        
        // === CONFIGURACIÓN DEL MUNDO Y CÁMARA ===
        // Expandir el mundo del juego (nivel más grande)
        this.physics.world.setBounds(0, 0, 2400, 600); // 3x más ancho
        
        // Configurar cámara
        camara = this.cameras.main;
        camara.setBounds(0, 0, 2400, 600); // Límites de la cámara = límites del mundo
        
        // === SUELO Y PLATAFORMAS ===
        platforms = this.physics.add.staticGroup();
        
        // Suelo principal (marrón tipo Mario) - Extendido para todo el nivel
        let suelo = this.add.rectangle(1200, 568, 2400, 64, 0x8B4513);
        this.physics.add.existing(suelo, true);
        platforms.add(suelo);
        
        // === BLOQUES FLOTANTES ===
        bloques = this.physics.add.staticGroup();
        bloquesRompibles = [];
        bloquesPregunta = [];
        
        let bloqueIdCounter = 0;
        
        // Zona inicial (0-800)
        // Bloques rompibles (naranja oscuro)
        for (let i = 0; i < 2; i++) {
            let bloque = this.add.rectangle(80 + i*32, 400, 30, 30, 0xCC6600);
            this.physics.add.existing(bloque, true);
            bloque.tipo = 'rompible';
            bloque.id = bloqueIdCounter++;
            bloque.roto = false;
            bloques.add(bloque);
            bloquesRompibles.push(bloque);
        }
        
        // Bloque de pregunta (amarillo con símbolo ?)
        let bloquePregunta1 = this.add.rectangle(144, 400, 30, 30, 0xFFD700);
        this.physics.add.existing(bloquePregunta1, true);
        bloquePregunta1.tipo = 'pregunta';
        bloquePregunta1.id = bloqueIdCounter++;
        bloquePregunta1.usado = false;
        bloquePregunta1.contenido = 'champinon'; // o 'moneda'
        bloques.add(bloquePregunta1);
        bloquesPregunta.push(bloquePregunta1);
        
        // Símbolo ? en el bloque
        bloquePregunta1.simbolo = this.add.text(144, 400, '?', {
            fontSize: '20px',
            color: '#8B4513',
            fontStyle: 'bold'
        });
        bloquePregunta1.simbolo.setOrigin(0.5, 0.5);
        
        // Bloques rompibles
        for (let i = 0; i < 2; i++) {
            let bloque = this.add.rectangle(300 + i*32, 300, 30, 30, 0xCC6600);
            this.physics.add.existing(bloque, true);
            bloque.tipo = 'rompible';
            bloque.id = bloqueIdCounter++;
            bloque.roto = false;
            bloques.add(bloque);
            bloquesRompibles.push(bloque);
        }
        
        // Bloque de pregunta con moneda
        let bloquePregunta2 = this.add.rectangle(364, 300, 30, 30, 0xFFD700);
        this.physics.add.existing(bloquePregunta2, true);
        bloquePregunta2.tipo = 'pregunta';
        bloquePregunta2.id = bloqueIdCounter++;
        bloquePregunta2.usado = false;
        bloquePregunta2.contenido = 'moneda';
        bloques.add(bloquePregunta2);
        bloquesPregunta.push(bloquePregunta2);
        bloquePregunta2.simbolo = this.add.text(364, 300, '?', {
            fontSize: '20px',
            color: '#8B4513',
            fontStyle: 'bold'
        });
        bloquePregunta2.simbolo.setOrigin(0.5, 0.5);
        
        // Otro bloque de pregunta
        let bloquePregunta3 = this.add.rectangle(396, 300, 30, 30, 0xFFD700);
        this.physics.add.existing(bloquePregunta3, true);
        bloquePregunta3.tipo = 'pregunta';
        bloquePregunta3.id = bloqueIdCounter++;
        bloquePregunta3.usado = false;
        bloquePregunta3.contenido = 'champinon';
        bloques.add(bloquePregunta3);
        bloquesPregunta.push(bloquePregunta3);
        bloquePregunta3.simbolo = this.add.text(396, 300, '?', {
            fontSize: '20px',
            color: '#8B4513',
            fontStyle: 'bold'
        });
        bloquePregunta3.simbolo.setOrigin(0.5, 0.5);
        
        // Bloques rompibles
        for (let i = 0; i < 2; i++) {
            let bloque = this.add.rectangle(500 + i*32, 250, 30, 30, 0xCC6600);
            this.physics.add.existing(bloque, true);
            bloque.tipo = 'rompible';
            bloque.id = bloqueIdCounter++;
            bloque.roto = false;
            bloques.add(bloque);
            bloquesRompibles.push(bloque);
        }
        
        // Zona media (800-1600)
        for (let i = 0; i < 5; i++) {
            let bloque = this.add.rectangle(900 + i*32, 350, 30, 30, 0xFF8C00);
            this.physics.add.existing(bloque, true);
            bloques.add(bloque);
        }
        
        for (let i = 0; i < 3; i++) {
            let bloque = this.add.rectangle(1200 + i*32, 280, 30, 30, 0xFF8C00);
            this.physics.add.existing(bloque, true);
            bloques.add(bloque);
        }
        
        for (let i = 0; i < 4; i++) {
            let bloque = this.add.rectangle(1400 + i*32, 200, 30, 30, 0xFF8C00);
            this.physics.add.existing(bloque, true);
            bloques.add(bloque);
        }
        
        // Zona final (1600-2400)
        for (let i = 0; i < 6; i++) {
            let bloque = this.add.rectangle(1700 + i*32, 320, 30, 30, 0xFF8C00);
            this.physics.add.existing(bloque, true);
            bloques.add(bloque);
        }
        
        for (let i = 0; i < 3; i++) {
            let bloque = this.add.rectangle(2000 + i*32, 250, 30, 30, 0xFF8C00);
            this.physics.add.existing(bloque, true);
            bloques.add(bloque);
        }
        
        // Bloques superiores dispersos por todo el nivel
        let posicionesBloques = [
            {x:200,y:150}, {x:450,y:180}, {x:650,y:200}, {x:700,y:150},
            {x:1000,y:180}, {x:1300,y:150}, {x:1600,y:200}, {x:1900,y:170}, {x:2200,y:150}
        ];
        posicionesBloques.forEach(pos => {
            let bloque = this.add.rectangle(pos.x, pos.y, 30, 30, 0xFF8C00);
            this.physics.add.existing(bloque, true);
            bloques.add(bloque);
        });
        
        // === TUBOS VERDES (estilo Mario) ===
        tubos = this.physics.add.staticGroup();
        
        // Tubos distribuidos por el nivel
        let datosTubos = [
            {x: 150, baseH: 80, topY: 470},   // Inicio - pequeño
            {x: 650, baseH: 160, topY: 390},  // Zona 1 - grande
            {x: 1100, baseH: 120, topY: 430}, // Zona 2 - medio
            {x: 1500, baseH: 100, topY: 450}, // Zona 3 - medio
            {x: 1900, baseH: 140, topY: 410}, // Zona 4 - grande
            {x: 2200, baseH: 80, topY: 470}   // Final - pequeño
        ];
        
        datosTubos.forEach(tubo => {
            let baseY = 568 - tubo.baseH/2;
            let tuboBase = this.add.rectangle(tubo.x, baseY, 50, tubo.baseH, 0x00CC00);
            let tuboTop = this.add.rectangle(tubo.x, tubo.topY, 60, 20, 0x00FF00);
            this.physics.add.existing(tuboBase, true);
            this.physics.add.existing(tuboTop, true);
            tubos.add(tuboBase);
            tubos.add(tuboTop);
        });
        
        // === ESCALERAS (amarillas) ===
        escaleras = this.physics.add.staticGroup();
        
        // Escaleras distribuidas por el nivel
        let posicionesEscaleras = [750, 1300, 1850, 2300];
        posicionesEscaleras.forEach(x => {
            for (let i = 0; i < 4; i++) {
                let escalon = this.add.rectangle(x + i*25, 536 - i*25, 25, 25, 0xDAA520);
                this.physics.add.existing(escalon, true);
                escaleras.add(escalon);
            }
        });
        
        // === MONEDAS (amarillo brillante) ===
        monedas = [];
        let monedaId = 0; // Contador para IDs únicos
        
        // Monedas distribuidas por todo el nivel
        // Zona 1 (0-800)
        monedas.push(...Moneda.crearLinea(this, 300, 270, 4, 32, monedaId));
        monedaId += 4;
        
        // Zona 2 (800-1600)
        monedas.push(...Moneda.crearLinea(this, 900, 320, 5, 32, monedaId));
        monedaId += 5;
        
        monedas.push(...Moneda.crearLinea(this, 1200, 250, 3, 32, monedaId));
        monedaId += 3;
        
        // Zona 3 (1600-2400)
        monedas.push(...Moneda.crearLinea(this, 1700, 290, 6, 32, monedaId));
        monedaId += 6;
        
        monedas.push(...Moneda.crearLinea(this, 2000, 220, 3, 32, monedaId));
        monedaId += 3;
        
        // === ENEMIGOS GOOMBA (marrones) ===
        goombas = this.physics.add.group();
        
        // Crear Goombas distribuidos por el nivel usando la clase
        let posicionesGoombas = [
            {x: 400, y: 500},
            {x: 1400, y: 500},
            {x: 2000, y: 500}
        ];
        
        let goombasArray = Goomba.crearGoombas(this, posicionesGoombas);
        goombasArray.forEach(goomba => {
            goombas.add(goomba.getSprite());
        });
        
        // === PLANTAS PIRAÑA (rojas con verde) ===
        plantasPirana = [];
        
        // Posiciones de tuberías que tendrán plantas (datos copiados de datosTubos)
        // Seleccionamos tubos específicos: índices 1, 2, 4
        let tubosConPlantas = [
            {x: 650, baseH: 160, topY: 390},  // Zona 1 - grande
            {x: 1100, baseH: 120, topY: 430}, // Zona 2 - medio
            {x: 1900, baseH: 140, topY: 410}  // Zona 4 - grande
        ];
        
        tubosConPlantas.forEach(tuboData => {
            // Crear la planta (cuerpo rojo con cabeza verde)
            let planta = {
                // Cuerpo de la planta (rojo)
                cuerpo: this.add.rectangle(tuboData.x, tuboData.topY, 30, 40, 0xFF0000),
                // Cabeza de la planta (verde)
                cabeza: this.add.rectangle(tuboData.x, tuboData.topY - 25, 35, 25, 0x00FF00),
                // Posiciones de animación
                tuboY: tuboData.topY,
                yEscondida: tuboData.topY + 20, // Dentro del tubo
                yVisible: tuboData.topY - 40,   // Fuera del tubo
                // Estado
                visible: false,
                activa: true,
                cicloTiempo: Date.now(),
                duracionCiclo: 3000 + Math.random() * 2000, // 3-5 segundos por ciclo
                // Timing
                tiempoVisible: 1500,   // 1.5 segundos visible
                tiempoEscondida: 1500, // 1.5 segundos escondida
                fase: 'escondida' // 'escondida', 'subiendo', 'visible', 'bajando'
            };
            
            // Posicionar inicialmente escondida
            planta.cuerpo.y = planta.yEscondida;
            planta.cabeza.y = planta.yEscondida - 25;
            
            plantasPirana.push(planta);
        });
        
        // === ENEMIGOS KOOPA (tortugas verdes) ===
        koopas = this.physics.add.group();
        
        // Crear Koopas distribuidos por el nivel usando la clase
        let posicionesKoopas = [
            {x: 500, y: 500},
            {x: 800, y: 500},
            {x: 1100, y: 500},
            {x: 1300, y: 500},
            {x: 1750, y: 500}
        ];
        
        listaKoopas = Koopa.crearKoopas(this, posicionesKoopas);
        listaKoopas.forEach(koopa => {
            koopas.add(koopa.getSprite());
        });

        // Grupo separado para caparazones (inicialmente vacío)
        caparazonesGroup = this.physics.add.group();


        // === POWER-UPS: CHAMPIÑONES ===
        champinones = this.physics.add.group();
        
        // Crear champiñones en posiciones específicas (sobre plataformas) usando la clase
        let posicionesChampi = [
            {x: 300, y: 450},   // Cerca del inicio
            {x: 900, y: 300},   // Sobre una plataforma media
            {x: 1500, y: 450}   // Más adelante
        ];
        
        let champinonesArray = Champinon.crearChampinones(this, posicionesChampi);
        champinonesArray.forEach(champinon => {
            champinones.add(champinon.getSprite());
        });

        // === JUGADORES ===
        // Crear jugador principal usando la clase Jugador
        jugadorPrincipal = new Jugador(this, 50, 450, 0xff0000);
        player = jugadorPrincipal.getSprite();
        playerIndicator = jugadorPrincipal.getIndicador();
        
        // Colisiones del jugador con el entorno
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(player, bloques);
        this.physics.add.collider(player, tubos);
        this.physics.add.collider(player, escaleras);
        
        // Colisiones de Goombas con entorno
        this.physics.add.collider(goombas, platforms);
        this.physics.add.collider(goombas, bloques);
        this.physics.add.collider(goombas, tubos);
        this.physics.add.collider(goombas, escaleras);
        
        // Colisión entre Goombas (para que reboten entre ellos)
        this.physics.add.collider(goombas, goombas);
        
        // Colisiones de Koopas con entorno
        this.physics.add.collider(koopas, platforms);
        this.physics.add.collider(koopas, bloques);
        this.physics.add.collider(koopas, tubos);
        this.physics.add.collider(koopas, escaleras);
        
        // Colisión entre Koopas - solo cuando ambos están caminando
        this.physics.add.collider(koopas, koopas, null, function(sprite1, sprite2) {
            // Solo permitir colisión física si ambos son Koopas caminando
            // Los caparazones se manejan manualmente para evitar empujes
            let obj1 = sprite1.koopaRef || sprite1.caparazonRef;
            let obj2 = sprite2.koopaRef || sprite2.caparazonRef;
            
            return (obj1 instanceof Koopa) && (obj2 instanceof Koopa);
        });

        // Colisiones de caparazones con entorno (grupo separado)
        this.physics.add.collider(caparazonesGroup, platforms);
        this.physics.add.collider(caparazonesGroup, bloques);
        this.physics.add.collider(caparazonesGroup, tubos);
        this.physics.add.collider(caparazonesGroup, escaleras);
        
        // Colisión entre Goombas y Koopas
        this.physics.add.collider(goombas, koopas);
        
        // Colisiones de champiñones con plataformas
        this.physics.add.collider(champinones, platforms);
        this.physics.add.collider(champinones, bloques);
        this.physics.add.collider(champinones, tubos);
        this.physics.add.collider(champinones, escaleras);
        
        // Collider entre jugador y caparazones (grupo separado)
        // Solo permite colisión física con caparazones quietos (para empujar)
        // Caparazones en movimiento solo se detectan por overlap en el callback de abajo
        this.physics.add.collider(player, caparazonesGroup, function(jugador, capSprite) {
            let caparazon = capSprite.caparazonRef;
            if (!caparazon) return;

            // Detectar golpe desde arriba primero y delegar a la lógica central
            let jugadorPiesY = jugador.y + (jugador.displayHeight / 2);
            let caparazonTopY = capSprite.y - (capSprite.displayHeight / 4);
            let estaCayendo = jugador.body.velocity.y >= 0;
            let golpeDesdeArriba = estaCayendo && jugadorPiesY < (caparazonTopY + 15);

            if (golpeDesdeArriba) {
                // Usar la función central para manejar rebote/lanzamiento/detener
                golpearKoopa(jugador, capSprite);
                return;
            }

            // Si es un caparazón quieto y no fue pisado desde arriba, empujarlo lateralmente
            if (!caparazon.estaEnMovimiento() && caparazon.cooldownColision <= 0) {
                caparazon.cooldownColision = 100;
                let direccionEmpuje = (jugador.x < capSprite.x) ? 1 : -1;
                caparazon.empujar(direccionEmpuje);

                console.log("¡Caparazón empujado por colisión física! Velocidad:", caparazon.getVelocidad());

                ws.enviarKoopaEstado({
                    codigo: codigo,
                    koopaId: caparazon.getId(),
                    estado: 'caparazon',
                    velocidad: caparazon.getVelocidad()
                });
            }

            // Si está en movimiento y no fue pisado desde arriba, no hacemos nada extra aquí
        }, function(jugador, capSprite) {
            // Permitir colisión física si el caparazón está quieto
            let caparazon = capSprite.caparazonRef;
            if (!caparazon) return false;
            if (!caparazon.estaEnMovimiento()) return true;

            // Si está en movimiento, solo permitir colisión si el jugador viene desde arriba
            let jugadorPiesY = jugador.y + (jugador.displayHeight / 2);
            let caparazonTopY = capSprite.y - (capSprite.displayHeight / 4);
            let estaCayendo = jugador.body.velocity.y >= 0;
            let golpeDesdeArriba = estaCayendo && jugadorPiesY < (caparazonTopY + 15);

            return !!golpeDesdeArriba;
        });

        // Overlap adicional para detectar caparazones en movimiento (cuando el jugador los pisa)
        this.physics.add.overlap(player, caparazonesGroup, function(jugador, capSprite) {
            let caparazon = capSprite.caparazonRef;
            if (caparazon && caparazon.estaEnMovimiento() && caparazon.isActivo()) {
                console.log("Overlap detectado con caparazón en movimiento. Velocidad:", caparazon.getVelocidad());
                golpearKoopa(jugador, capSprite);
            }
        });
        
        // Collider entre caparazones - cuando chocan, rebotan en direcciones opuestas
        this.physics.add.collider(koopas, koopas, function(sprite1, sprite2) {
            let caparazon1 = sprite1.caparazonRef;
            let caparazon2 = sprite2.caparazonRef;
            
            // Solo procesar si ambos son caparazones activos y al menos uno está en movimiento
            if (caparazon1 && caparazon2 && caparazon1.isActivo() && caparazon2.isActivo()) {
                let enMovimiento1 = caparazon1.estaEnMovimiento();
                let enMovimiento2 = caparazon2.estaEnMovimiento();
                
                if (enMovimiento1 || enMovimiento2) {
                    // Evitar múltiples rebotes usando cooldown
                    if (caparazon1.cooldownRebote <= 0 && caparazon2.cooldownRebote <= 0) {
                        // Invertir direcciones de ambos caparazones
                        if (enMovimiento1) {
                            caparazon1.invertirDireccion();
                            caparazon1.cooldownRebote = 200;
                        }
                        if (enMovimiento2) {
                            caparazon2.invertirDireccion();
                            caparazon2.cooldownRebote = 200;
                        }
                        
                        console.log("¡Caparazones chocaron! Rebotando...");
                        
                        // Enviar sincronización de ambos caparazones
                        if (enMovimiento1) {
                            ws.enviarKoopaEstado({
                                codigo: codigo,
                                koopaId: caparazon1.getId(),
                                estado: 'caparazon',
                                velocidad: caparazon1.getVelocidad()
                            });
                        }
                        if (enMovimiento2) {
                            ws.enviarKoopaEstado({
                                codigo: codigo,
                                koopaId: caparazon2.getId(),
                                estado: 'caparazon',
                                velocidad: caparazon2.getVelocidad()
                            });
                        }
                    }
                }
            }
        }, function(sprite1, sprite2) {
            // Process callback - permitir colisión física si al menos uno está en movimiento
            let caparazon1 = sprite1.caparazonRef;
            let caparazon2 = sprite2.caparazonRef;
            
            // Permitir colisión si ambos son caparazones y al menos uno está en movimiento
            if (caparazon1 && caparazon2) {
                return caparazon1.estaEnMovimiento() || caparazon2.estaEnMovimiento();
            }
            
            return false;
        });
        
        // === CONFIGURACIÓN DE LA CÁMARA ===
        // La cámara sigue al jugador principal (estilo New Super Mario Bros)
        camara.startFollow(player, true, 0.1, 0.1);
        // Zoom ligeramente out para ver más del nivel
        camara.setZoom(1);
        // Dead zone: área donde el jugador puede moverse sin que la cámara se mueva
        camara.setDeadzone(150, 100);
        // Lerp: suavizado del movimiento de la cámara
        camara.setLerp(0.1, 0.1);

        // Crear otro jugador usando la clase OtroJugador
        jugadorRemoto = new OtroJugador(this, 100, 450, 0x0000ff);
        otroJugador = jugadorRemoto.getSprite();
        
        // ¡COLISIÓN ENTRE JUGADORES! - No se atraviesan
        this.physics.add.collider(player, otroJugador);
        
        // === INTERFAZ DE PUNTUACIÓN (estilo Mario Bros) ===
        // Línea 1: Jugador 1 (Rojo)
        // Indicador de color del jugador
        let colorIndicadorRojo = this.add.circle(20, 20, 10, 0xff0000);
        colorIndicadorRojo.setScrollFactor(0);
        colorIndicadorRojo.setDepth(100);
        
        // Vidas del jugador rojo
        textoMiVidas = this.add.text(40, 10, 'x3', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        textoMiVidas.setScrollFactor(0);
        textoMiVidas.setDepth(100);
        
        // Monedas del jugador rojo
        let iconoMonedaRojo = this.add.circle(95, 20, 8, 0xFFD700);
        iconoMonedaRojo.setScrollFactor(0);
        iconoMonedaRojo.setDepth(100);
        
        textoMiPuntuacion = this.add.text(110, 10, 'x0', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        textoMiPuntuacion.setScrollFactor(0);
        textoMiPuntuacion.setDepth(100);
        
        // Línea 2: Jugador 2 (Azul)
        // Indicador de color del jugador
        let colorIndicadorAzul = this.add.circle(20, 50, 10, 0x0000ff);
        colorIndicadorAzul.setScrollFactor(0);
        colorIndicadorAzul.setDepth(100);
        
        // Vidas del jugador azul
        textoOtraVidas = this.add.text(40, 40, 'x3', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        textoOtraVidas.setScrollFactor(0);
        textoOtraVidas.setDepth(100);
        
        // Monedas del jugador azul
        let iconoMonedaAzul = this.add.circle(95, 50, 8, 0xFFD700);
        iconoMonedaAzul.setScrollFactor(0);
        iconoMonedaAzul.setDepth(100);
        
        textoOtroPuntuacion = this.add.text(110, 40, 'x0', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        textoOtroPuntuacion.setScrollFactor(0);
        textoOtroPuntuacion.setDepth(100);

        // Controles
        cursors = this.input.keyboard.createCursorKeys();

        console.log("Juego creado correctamente");
    }
    
    // Configurar listeners de WebSocket (una sola vez)
    function configurarListenersWS() {
        // Limpiar listeners anteriores si existen
        ws.socket.off("actualizacionJuego");
        ws.socket.off("actualizacionPuntuacion");
        ws.socket.off("monedaRecogida");
        ws.socket.off("goombaEliminado");
        ws.socket.off("koopaEstadoCambiado");
        
        // Recibir posición del rival
        ws.socket.on("actualizacionJuego", function(datos) {
            if (jugadorRemoto) {
                otroJugador.visible = true;
                // Actualizar posición objetivo usando la clase
                jugadorRemoto.actualizarPosicion(datos.x, datos.y);
            }
        });
        
        // Recibir puntuación del rival
        ws.socket.on("actualizacionPuntuacion", function(datos) {
            if (datos && datos.puntuacion !== undefined) {
                puntuacionOtro = datos.puntuacion;
                if (textoOtroPuntuacion) {
                    textoOtroPuntuacion.setText('x' + puntuacionOtro);
                }
            }
        });
        
        // Recibir monedas recogidas por el rival
        ws.socket.on("monedaRecogida", function(datos) {
            console.log("Evento monedaRecogida recibido:", datos);
            if (datos && datos.monedaId !== undefined) {
                // Buscar la moneda con ese ID y ocultarla usando la clase
                let moneda = monedas.find(m => m.getId() === datos.monedaId);
                if (moneda && moneda.isActiva()) {
                    moneda.recoger();
                    console.log("Moneda", datos.monedaId, "recogida por el otro jugador - ocultada");
                } else {
                    console.log("Moneda no encontrada o ya inactiva:", datos.monedaId);
                }
            }
        });
        
        // Recibir Goombas eliminados por el rival
        ws.socket.on("goombaEliminado", function(datos) {
            console.log("Evento goombaEliminado recibido:", datos);
            if (datos && datos.goombaId !== undefined) {
                eliminarGoomba(datos.goombaId);
                console.log("Goomba", datos.goombaId, "eliminado por el otro jugador");
            }
        });
        
        // Recibir cambios de estado de Koopas por el rival
        ws.socket.on("koopaEstadoCambiado", function(datos) {
            console.log("Evento koopaEstadoCambiado recibido:", datos);
            if (datos && datos.koopaId !== undefined) {
                // Primero buscar en listaKoopas (todavía caminando)
                let koopaEncontrado = listaKoopas.find(k => k.getId() === datos.koopaId);
                
                if (koopaEncontrado && datos.estado === 'caparazon') {
                    // Convertir Koopa a caparazón
                    console.log("Convirtiendo Koopa", datos.koopaId, "a caparazón remotamente");
                    let nuevoCaparazon = koopaEncontrado.convertirACaparazon();
                    nuevoCaparazon.setVelocidad(datos.velocidad || 0);
                    
                    // Remover de listaKoopas y agregar a listaCaparazones
                    let index = listaKoopas.indexOf(koopaEncontrado);
                    if (index > -1) {
                        listaKoopas.splice(index, 1);
                    }
                    listaCaparazones.push(nuevoCaparazon);
                    // Mover sprite del grupo `koopas` al grupo `caparazonesGroup` (sin errores si no existe)
                    try {
                        koopas.remove(koopaEncontrado.getSprite());
                        caparazonesGroup.add(nuevoCaparazon.getSprite());
                    } catch (e) {
                        console.warn('No se pudo mover sprite entre grupos (remoto):', e);
                    }
                    
                    console.log("Koopa", datos.koopaId, "convertido a caparazón con velocidad", datos.velocidad);
                } else {
                    // Buscar en listaCaparazones (ya es caparazón, solo actualizar velocidad)
                    let caparazonEncontrado = listaCaparazones.find(c => c.getId() === datos.koopaId);
                    
                    if (caparazonEncontrado && datos.estado === 'caparazon') {
                        caparazonEncontrado.setVelocidad(datos.velocidad || 0);
                        console.log("Caparazón", datos.koopaId, "sincronizado con velocidad", datos.velocidad);
                    }
                }
            }
        });
        
        // Recibir champiñones recogidos por el rival
        ws.socket.on("champinonRecogido", function(datos) {
            console.log("Champiñón recogido por otro jugador (ID:", datos.champinonId, ")");
            // Eliminar el champiñón en la pantalla de este jugador
            eliminarChampinon(datos.champinonId);
        });
        
        // Recibir bloques rotos por el rival
        ws.socket.on("bloqueRoto", function(datos) {
            console.log("Bloque roto por otro jugador (ID:", datos.bloqueId, ")");
            // Buscar y romper el bloque localmente
            bloquesRompibles.forEach(bloque => {
                if (bloque.id === datos.bloqueId && !bloque.roto) {
                    bloque.roto = true;
                    bloque.visible = false;
                    bloque.body.enable = false;
                    console.log("Bloque", datos.bloqueId, "roto y sincronizado");
                }
            });
        });
        
        // Recibir bloques de pregunta golpeados por el rival
        ws.socket.on("bloquePreguntaGolpeado", function(datos) {
            console.log("Bloque de pregunta golpeado por otro jugador (ID:", datos.bloqueId, "Contenido:", datos.contenido, ")");
            // Buscar y marcar el bloque como usado localmente
            bloquesPregunta.forEach(bloque => {
                if (bloque.id === datos.bloqueId && !bloque.usado) {
                    bloque.usado = true;
                    bloque.setFillStyle(0x8B4513);
                    if (bloque.simbolo) {
                        bloque.simbolo.visible = false;
                    }
                    console.log("Bloque de pregunta", datos.bloqueId, "marcado como usado");
                    
                    // Crear champiñón si el contenido es 'champinon'
                    if (datos.contenido === 'champinon') {
                        let idNuevo = champinones.getChildren().length;
                        let champiNuevo = Champinon.crearDesdeBloque(game.scene.scenes[0], datos.x, datos.y - 20, idNuevo);
                        champinones.add(champiNuevo.getSprite());
                        
                        // Añadir colisiones para el nuevo champiñón
                        game.scene.scenes[0].physics.add.collider(champiNuevo.getSprite(), platforms);
                        game.scene.scenes[0].physics.add.collider(champiNuevo.getSprite(), bloques);
                        game.scene.scenes[0].physics.add.collider(champiNuevo.getSprite(), tubos);
                        
                        console.log("Champiñón creado en la pantalla del otro jugador!");
                    } else if (datos.contenido === 'moneda') {
                        // Crear moneda que sale del bloque
                        let monedaNueva = game.scene.scenes[0].add.circle(datos.x, datos.y - 20, 8, 0xFFFF00);
                        game.scene.scenes[0].physics.add.existing(monedaNueva);
                        monedaNueva.body.setVelocityY(-250);
                        monedaNueva.body.setGravityY(800);
                        
                        // Eliminar moneda después de animación
                        setTimeout(() => {
                            monedaNueva.destroy();
                        }, 500);
                    }
                }
            });
        });
        
        // Recibir cambios de estado grande/pequeño del rival
        ws.socket.on("estadoGrandeCambiado", function(datos) {
            console.log("Estado grande del otro jugador cambiado:", datos.grande);
            if (jugadorRemoto) {
                jugadorRemoto.actualizarTamaño(datos.grande);
                console.log("Otro jugador actualizado en pantalla - Grande:", datos.grande);
            }
        });
        
        // Recibir cambios de vidas del rival
        ws.socket.on("vidasActualizadas", function(datos) {
            console.log("Vidas del otro jugador actualizadas:", datos.vidas);
            if (textoOtraVidas) {
                textoOtraVidas.setText('x' + datos.vidas);
            }
        });
        
        console.log("Listeners WebSocket configurados");
    }
    // Función para recoger monedas
    function recogerMoneda(moneda) {
        moneda.recoger(); // Usa el método de la clase Moneda
        puntuacionJugador++;
        textoMiPuntuacion.setText('x' + puntuacionJugador);
        console.log("¡Moneda recogida! ID:", moneda.getId(), "Total:", puntuacionJugador);
        
        // Enviar actualización de puntuación al servidor
        ws.enviarPuntuacion({
            codigo: codigo,
            puntuacion: puntuacionJugador
        });
        
        // Enviar qué moneda se recogió para sincronizar con el otro jugador
        ws.enviarMonedaRecogida({
            codigo: codigo,
            monedaId: moneda.getId()
        });
    }
    
    // Función helper para detectar overlap entre dos objetos
    function checkOverlap(obj1, obj2) {
        let bounds1 = obj1.getBounds();
        let bounds2 = obj2.getBounds();
        return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);
    }
    
    // Función para eliminar un Goomba (local)
    function eliminarGoomba(goombaId) {
        goombas.getChildren().forEach(goombaSprite => {
            if (goombaSprite.goombaRef && goombaSprite.goombaRef.getId() === goombaId) {
                goombaSprite.goombaRef.eliminar();
            }
        });
    }
    
    // Función para golpear un Koopa o Caparazón
    function golpearKoopa(jugador, koopaSprite) {
        // Obtener la referencia a la instancia (puede ser Koopa o Caparazon)
        let koopa = koopaSprite.koopaRef;
        let caparazon = koopaSprite.caparazonRef;
        
        // Determinar el objeto activo
        let entidad = koopa || caparazon;
        if (!entidad) return;
        if (!entidad.isActivo()) return;
        
        // Comprobar si el jugador está cayendo sobre el enemigo (desde arriba)
        let jugadorPiesY = jugador.y + (jugador.displayHeight / 2);
        let enemigoMitadSuperiorY = koopaSprite.y - (koopaSprite.displayHeight / 4);
        
        // Agregar margen de tolerancia para detección más robusta
        let margen = 15;
        let estaCayendo = jugador.body.velocity.y >= 0;
        let golpeDesdeArriba = estaCayendo && jugadorPiesY < (enemigoMitadSuperiorY + margen);
        
        // Para golpes desde arriba, ignorar cooldown (permite pisar caparazones en movimiento)
        // Para colisiones laterales, respetar cooldown
        if (!golpeDesdeArriba && entidad.cooldownColision > 0) {
            return;
        }
        
        let estadoActual = koopa ? 'caminando' : (caparazon.estaEnMovimiento() ? 'caparazon-movimiento' : 'caparazon-quieto');
        
        console.log("Colisión con Koopa/Caparazón - Estado:", estadoActual,
                    "VelocidadY:", jugador.body.velocity.y, 
                    "JugadorPiesY:", jugadorPiesY, "EnemigoMitadY:", enemigoMitadSuperiorY,
                    "¿Desde arriba?:", golpeDesdeArriba);
        
        if (golpeDesdeArriba) {
            // Rebote del jugador (mismo impulso que al matar Goomba)
            jugador.body.setVelocityY(-450);
            reboteEnemigo = true; // Evitar limitación de velocidad
            
            if (koopa) {
                // Koopa caminando → Convertir a caparazón quieto
                let nuevoCaparazon = koopa.convertirACaparazon();
                
                // Establecer cooldown en el NUEVO caparazón para evitar empuje inmediato
                nuevoCaparazon.cooldownColision = 300;
                
                // Remover de listaKoopas y agregar a listaCaparazones
                let index = listaKoopas.indexOf(koopa);
                if (index > -1) {
                    listaKoopas.splice(index, 1);
                }
                listaCaparazones.push(nuevoCaparazon);

                // Mover el sprite del grupo `koopas` al grupo `caparazonesGroup`
                try {
                    koopas.remove(koopa.getSprite());
                    caparazonesGroup.add(nuevoCaparazon.getSprite());
                } catch (e) {
                    console.warn('No se pudo mover sprite entre grupos (local):', e);
                }
                
                console.log("¡Koopa convertido a caparazón! ID:", koopa.getId());
                
                // Enviar sincronización
                ws.enviarKoopaEstado({
                    codigo: codigo,
                    koopaId: koopa.getId(),
                    estado: 'caparazon',
                    velocidad: 0
                });
            } else if (caparazon.estaEnMovimiento()) {
                // Caparazón en movimiento → DETENERLO al saltar encima
                caparazon.detener();
                
                // Cooldown para evitar empuje inmediato después de detenerse
                caparazon.cooldownColision = 300;
                
                console.log("¡Caparazón detenido al saltar encima! ID:", caparazon.getId());
                
                // Enviar sincronización
                ws.enviarKoopaEstado({
                    codigo: codigo,
                    koopaId: caparazon.getId(),
                    estado: 'caparazon',
                    velocidad: 0
                });
            } else {
                // Caparazón quieto → Lanzarlo
                let direccionLanzamiento = (jugador.x < koopaSprite.x) ? 1 : -1;
                caparazon.lanzar(direccionLanzamiento);
                
                // Cooldown para evitar que cause daño inmediatamente después de lanzarse
                caparazon.cooldownColision = 300;
                
                console.log("¡Caparazón lanzado! Velocidad:", caparazon.getVelocidad());
                
                // Enviar sincronización
                ws.enviarKoopaEstado({
                    codigo: codigo,
                    koopaId: caparazon.getId(),
                    estado: 'caparazon',
                    velocidad: caparazon.getVelocidad()
                });
            }
        } else {
            // Colisión lateral
            console.log("Colisión lateral detectada. Koopa:", !!koopa, "Caparazón en movimiento:", caparazon ? caparazon.estaEnMovimiento() : false);
            
            if (koopa) {
                // Koopa caminando hace daño
                if (!jugadorPrincipal.esInvulnerable()) {
                    console.log("¡Colisión lateral con Koopa caminando! Perdiendo vida...");
                    perderVida();
                    entidad.cooldownColision = 1000; // Cooldown largo tras hacer daño
                }
            } else if (caparazon.estaEnMovimiento()) {
                // Caparazón EN MOVIMIENTO: hace daño y NO se detiene
                console.log("Caparazón en movimiento - Invulnerable:", jugadorPrincipal.esInvulnerable());
                if (!jugadorPrincipal.esInvulnerable()) {
                    console.log("¡Golpeado por caparazón en movimiento! Perdiendo vida...");
                    perderVida();
                    entidad.cooldownColision = 1000; // Cooldown largo tras hacer daño
                }
                // El caparazón sigue moviéndose sin cambios
            } else {
                // Caparazón QUIETO: empujarlo sin recibir daño
                // Cooldown muy corto para permitir empujes continuos
                entidad.cooldownColision = 50; // 50ms de cooldown
                
                let direccionEmpuje = (jugador.x < koopaSprite.x) ? 1 : -1;
                caparazon.empujar(direccionEmpuje);
                
                console.log("¡Caparazón empujado lateralmente! Velocidad:", caparazon.getVelocidad());
                
                // Enviar sincronización
                ws.enviarKoopaEstado({
                    codigo: codigo,
                    koopaId: caparazon.getId(),
                    estado: 'caparazon',
                    velocidad: caparazon.getVelocidad()
                });
            }
        }
    }
    
    // Función para verificar overlap genérico
    function checkOverlap(obj1, obj2) {
        let bounds1 = obj1.getBounds ? obj1.getBounds() : {
            x: obj1.x - obj1.displayWidth/2,
            y: obj1.y - obj1.displayHeight/2,
            width: obj1.displayWidth,
            height: obj1.displayHeight
        };
        let bounds2 = obj2.getBounds ? obj2.getBounds() : {
            x: obj2.x - obj2.displayWidth/2,
            y: obj2.y - obj2.displayHeight/2,
            width: obj2.displayWidth,
            height: obj2.displayHeight
        };
        
        return Phaser.Geom.Intersects.RectangleToRectangle(
            new Phaser.Geom.Rectangle(bounds1.x, bounds1.y, bounds1.width, bounds1.height),
            new Phaser.Geom.Rectangle(bounds2.x, bounds2.y, bounds2.width, bounds2.height)
        );
    }
    
    // Función para verificar overlap vertical (golpe desde abajo)
    function checkOverlapVertical(jugador, bloque) {
        // Verificar si la cabeza del jugador está tocando la parte inferior del bloque
        let jugadorCabezaY = jugador.y - (jugador.displayHeight / 2);
        let bloqueBaseY = bloque.y + 15; // Parte inferior del bloque (bloque tiene altura 30, mitad = 15)
        
        let distanciaVertical = Math.abs(jugadorCabezaY - bloqueBaseY);
        let distanciaHorizontal = Math.abs(jugador.x - bloque.x);
        
        // Debe estar cerca verticalmente (cabeza tocando base) y alineado horizontalmente
        // Aumentada la tolerancia para mejor detección
        return distanciaVertical < 10 && distanciaHorizontal < (jugador.displayWidth/2 + 20);
    }
    
    // Función para golpear un Goomba
    function golpearGoomba(jugador, goombaSprite) {
        if (!goombaSprite.goombaRef) return;
        let goomba = goombaSprite.goombaRef;
        
        if (!goomba.isActivo()) return; // Ya está muerto
        
        // Comprobar si el jugador está cayendo sobre el Goomba (desde arriba)
        let jugadorPiesY = jugador.y + (jugador.displayHeight / 2);
        let goombaMitadSuperiorY = goombaSprite.y - (goombaSprite.displayHeight / 4);
        
        // El jugador debe estar cayendo (velocidad Y positiva o cero)
        // Y los pies del jugador deben estar en la mitad superior del Goomba
        let estaCayendo = jugador.body.velocity.y >= 0;
        let golpeDesdeArriba = estaCayendo && jugadorPiesY < goombaMitadSuperiorY;
        
        console.log("Colisión con Goomba - VelocidadY:", jugador.body.velocity.y, 
                    "JugadorPiesY:", jugadorPiesY, "GoombaMitadY:", goombaMitadSuperiorY,
                    "¿Desde arriba?:", golpeDesdeArriba);
        
        if (golpeDesdeArriba) {
            // Hacer que el jugador rebote PRIMERO
            jugador.body.setVelocityY(-450);
            reboteEnemigo = true; // Evitar limitación de velocidad
            
            // Eliminar localmente
            eliminarGoomba(goomba.getId());
            
            // Enviar al servidor para sincronizar
            ws.enviarGoombaEliminado({
                codigo: codigo,
                goombaId: goomba.getId()
            });
            
            console.log("¡Goomba eliminado saltando encima! ID:", goomba.getId());
        } else {
            // Colisión lateral - pierde vida
            if (!jugadorPrincipal.esInvulnerable()) {
                console.log("¡Colisión lateral con Goomba! Perdiendo vida...");
                perderVida();
            }
        }
    }
    
    // Función para perder una vida
    function perderVida() {
        // Guardar estado anterior para detectar cambio de tamaño
        let eraGrande = jugadorPrincipal.esGrande();
        
        // Usar el método de la clase Jugador que ya maneja todo
        let esGameOver = jugadorPrincipal.perderVida();
        
        // Actualizar texto de vidas en el HUD
        textoMiVidas.setText('x' + jugadorPrincipal.getVidas());
        
        // Sincronizar cambio de tamaño con otro jugador
        if (eraGrande && !jugadorPrincipal.esGrande()) {
            ws.enviarEstadoGrande({
                codigo: codigo,
                grande: false
            });
        }
        
        // Sincronizar vidas con otro jugador
        ws.enviarVidas({
            codigo: codigo,
            vidas: jugadorPrincipal.getVidas()
        });
        
        if (esGameOver) {
            gameOverFunc();
        }
    }
    
    // Función para eliminar champiñón visualmente
    function eliminarChampinon(champiId) {
        champinones.getChildren().forEach(champiSprite => {
            if (champiSprite.champRef && champiSprite.champRef.getId() === champiId) {
                champiSprite.champRef.recoger();
            }
        });
    }
    
    // Función para romper bloque
    function romperBloque(bloque) {
        if (bloque.roto) return;
        
        bloque.roto = true;
        bloque.visible = false;
        bloque.body.enable = false;
        
        console.log("¡Bloque roto! ID:", bloque.id);
        
        // Efecto visual de fragmentos (4 cuadraditos que vuelan)
        for (let i = 0; i < 4; i++) {
            let fragmento = game.scene.scenes[0].add.rectangle(
                bloque.x + (i % 2) * 8 - 4,
                bloque.y + Math.floor(i / 2) * 8 - 4,
                8, 8, 0xCC6600 // Mismo color que el bloque rompible
            );
            game.scene.scenes[0].physics.add.existing(fragmento);
            fragmento.body.setVelocity(
                (Math.random() - 0.5) * 200,
                -200 - Math.random() * 100
            );
            fragmento.body.setGravityY(800);
            
            // Eliminar fragmento después de 1 segundo
            setTimeout(() => fragmento.destroy(), 1000);
        }
        
        // Sincronizar con otros jugadores
        ws.enviarBloqueRoto({
            codigo: codigo,
            bloqueId: bloque.id
        });
    }
    
    // Función para golpear bloque de pregunta
    function golpearBloquePregunta(bloque) {
        if (bloque.usado) return;
        
        bloque.usado = true;
        bloque.setFillStyle(0x8B4513); // Cambiar a marrón (bloque usado)
        if (bloque.simbolo) {
            bloque.simbolo.visible = false;
        }
        
        console.log("¡Bloque de pregunta golpeado! ID:", bloque.id, "Contenido:", bloque.contenido);
        
        // Animación de golpe (bloque sube y baja)
        let posOriginal = bloque.y;
        bloque.y -= 8;
        setTimeout(() => {
            bloque.y = posOriginal;
        }, 100);
        
        // Soltar contenido según tipo
        if (bloque.contenido === 'moneda') {
            // Crear moneda que sale del bloque
            let monedaNueva = game.scene.scenes[0].add.circle(bloque.x, bloque.y - 20, 8, 0xFFFF00);
            game.scene.scenes[0].physics.add.existing(monedaNueva);
            monedaNueva.body.setVelocityY(-250);
            monedaNueva.body.setGravityY(800);
            
            // Recoger moneda después de animación
            setTimeout(() => {
                puntuacionJugador++;
                textoMiPuntuacion.setText('x' + puntuacionJugador);
                monedaNueva.destroy();
                console.log("Moneda del bloque recogida! Total:", puntuacionJugador);
            }, 500);
            
        } else if (bloque.contenido === 'champinon') {
            // Crear champiñón que sale del bloque usando la clase
            let idNuevo = champinones.getChildren().length;
            let champiNuevo = Champinon.crearDesdeBloque(game.scene.scenes[0], bloque.x, bloque.y - 20, idNuevo);
            champinones.add(champiNuevo.getSprite());
            
            // Añadir colisiones para el nuevo champiñón
            game.scene.scenes[0].physics.add.collider(champiNuevo.getSprite(), platforms);
            game.scene.scenes[0].physics.add.collider(champiNuevo.getSprite(), bloques);
            game.scene.scenes[0].physics.add.collider(champiNuevo.getSprite(), tubos);
            
            console.log("Champiñón creado desde bloque!");
        }
        
        // Sincronizar con otros jugadores
        ws.enviarBloqueGolpeado({
            codigo: codigo,
            bloqueId: bloque.id,
            contenido: bloque.contenido,
            x: bloque.x,
            y: bloque.y
        });
    }
    
    // Función para recoger champiñón
    function recogerChampinon(champiSprite) {
        if (!champiSprite.champRef) return;
        let champi = champiSprite.champRef;
        
        if (!champi.isActivo()) return;
        
        console.log("¡Champiñón recogido! Jugador crece.");
        
        // Eliminar champiñón visualmente
        eliminarChampinon(champi.getId());
        
        // Hacer crecer al jugador usando la clase
        jugadorPrincipal.hacerCrecer();
        
        // Efecto visual de crecimiento (animación rápida)
        let crecimientoStep = 0;
        let intervaloCrecimiento = setInterval(() => {
            crecimientoStep++;
            if (crecimientoStep >= 3) {
                clearInterval(intervaloCrecimiento);
            }
        }, 100);
        
        // Sincronizar con el otro jugador - Enviar tanto el estado como el champiñón recogido
        ws.enviarEstadoGrande({
            codigo: codigo,
            grande: true
        });
        
        ws.enviarChampinonRecogido({
            codigo: codigo,
            champinonId: champi.getId()
        });
        
        console.log("Estado jugador grande:", jugadorPrincipal.esGrande());
    }
    
    // Función de Game Over
    function gameOverFunc() {
        console.log("Game Over!");
        // TODO: Implementar pantalla de Game Over
    }

    let lastUpdate = 0;
    function update(time) {
        // === GESTIONAR INVULNERABILIDAD ===
        // No es necesario, ahora se gestiona en la clase Jugador
        
        // === MOVIMIENTO DE GOOMBAS ===
        goombas.getChildren().forEach(goombaSprite => {
            if (goombaSprite.goombaRef) {
                goombaSprite.goombaRef.actualizar();
            }
        });
        
        // === MOVIMIENTO DE KOOPAS Y CAPARAZONES ===
        // Actualizar Koopas caminando
        listaKoopas.forEach(koopa => {
            if (koopa.isActivo()) {
                koopa.actualizar();
            }
        });
        
        // Actualizar Caparazones
        listaCaparazones.forEach(caparazon => {
            if (caparazon.isActivo()) {
                caparazon.actualizar();
            }
        });
        
        // === MOVIMIENTO DE CHAMPIÑONES ===
        champinones.getChildren().forEach(champiSprite => {
            if (champiSprite.champRef) {
                champiSprite.champRef.actualizar();
            }
        });
        
        // === ANIMACIÓN DE PLANTAS PIRAÑA ===
        plantasPirana.forEach(planta => {
            if (!planta.activa) return;
            
            let tiempoActual = Date.now();
            let tiempoEnFase = tiempoActual - planta.cicloTiempo;
            
            // Máquina de estados para la animación de la planta
            if (planta.fase === 'escondida') {
                if (tiempoEnFase > planta.tiempoEscondida) {
                    planta.fase = 'subiendo';
                    planta.cicloTiempo = tiempoActual;
                }
            } else if (planta.fase === 'subiendo') {
                // Animar subida (500ms)
                let progreso = Math.min(tiempoEnFase / 500, 1);
                let yActual = planta.yEscondida + (planta.yVisible - planta.yEscondida) * progreso;
                planta.cuerpo.y = yActual;
                planta.cabeza.y = yActual - 25;
                
                if (progreso >= 1) {
                    planta.fase = 'visible';
                    planta.visible = true;
                    planta.cicloTiempo = tiempoActual;
                }
            } else if (planta.fase === 'visible') {
                if (tiempoEnFase > planta.tiempoVisible) {
                    planta.fase = 'bajando';
                    planta.cicloTiempo = tiempoActual;
                }
            } else if (planta.fase === 'bajando') {
                // Animar bajada (500ms)
                let progreso = Math.min(tiempoEnFase / 500, 1);
                let yActual = planta.yVisible + (planta.yEscondida - planta.yVisible) * progreso;
                planta.cuerpo.y = yActual;
                planta.cabeza.y = yActual - 25;
                
                if (progreso >= 1) {
                    planta.fase = 'escondida';
                    planta.visible = false;
                    planta.cicloTiempo = tiempoActual;
                }
            }
        });
        
        // === DETECCIÓN MANUAL DE COLISIÓN CON GOOMBAS ===
        if (!jugadorPrincipal.esInvulnerable()) {
            goombas.getChildren().forEach(goombaSprite => {
                if (goombaSprite.goombaRef && goombaSprite.goombaRef.isActivo() && checkOverlap(player, goombaSprite)) {
                    golpearGoomba(player, goombaSprite);
                }
            });
        }
        
        // === DETECCIÓN MANUAL DE COLISIÓN CON KOOPAS ===
        koopas.getChildren().forEach(koopaSprite => {
            // Verificar si es un Koopa o Caparazón activo
            let entidad = koopaSprite.koopaRef || koopaSprite.caparazonRef;
            if (entidad && entidad.isActivo()) {
                // Para caparazones en movimiento, verificar overlap siempre
                // Para otros casos, solo si hay overlap
                let hayOverlap = checkOverlap(player, koopaSprite);
                
                if (hayOverlap) {
                    golpearKoopa(player, koopaSprite);
                }
            }
        });
        
        // === DETECCIÓN DE COLISIÓN CON CHAMPIÑONES ===
        champinones.getChildren().forEach(champiSprite => {
            if (champiSprite.champRef && champiSprite.champRef.isActivo() && checkOverlap(player, champiSprite)) {
                recogerChampinon(champiSprite);
            }
        });
        
        // === DETECCIÓN DE GOLPE A BLOQUES DESDE ABAJO ===
        // Verificar si el jugador está saltando y golpea un bloque desde abajo
        if (player.body.velocity.y < 0) { // Subiendo (saltando)
            // Verificar bloques rompibles
            bloquesRompibles.forEach(bloque => {
                if (!bloque.roto && checkOverlapVertical(player, bloque)) {
                    console.log("¡Bloque rompible golpeado!");
                    romperBloque(bloque);
                }
            });
            
            // Verificar bloques de pregunta
            bloquesPregunta.forEach(bloque => {
                if (!bloque.usado && checkOverlapVertical(player, bloque)) {
                    console.log("¡Bloque de pregunta golpeado!");
                    golpearBloquePregunta(bloque);
                }
            });
        }
        
        // === COLISIÓN DE CAPARAZONES EN MOVIMIENTO CON ENEMIGOS ===
        listaCaparazones.forEach(caparazon => {
            if (caparazon.isActivo() && caparazon.estaEnMovimiento()) {
                let caparazonSprite = caparazon.getSprite();
                
                // Caparazón en movimiento puede eliminar Goombas
                goombas.getChildren().forEach(goombaSprite => {
                    if (goombaSprite.goombaRef && goombaSprite.goombaRef.isActivo() && checkOverlap(caparazonSprite, goombaSprite)) {
                        console.log("¡Caparazón eliminó a un Goomba!");
                        let goombaId = goombaSprite.goombaRef.getId();
                        eliminarGoomba(goombaId);
                        ws.enviarGoombaEliminado({
                            codigo: codigo,
                            goombaId: goombaId
                        });
                    }
                });
                
                // Caparazón en movimiento puede convertir Koopas en caparazones
                listaKoopas.forEach(koopa => {
                    if (koopa.isActivo() && checkOverlap(caparazonSprite, koopa.getSprite())) {
                        console.log("¡Caparazón convirtió a un Koopa en caparazón!");
                        
                        let nuevoCaparazon = koopa.convertirACaparazon();
                        nuevoCaparazon.setVelocidad(caparazon.getVelocidad() * 0.7); // Transferir momento
                        
                        // Remover de listaKoopas y agregar a listaCaparazones
                        let index = listaKoopas.indexOf(koopa);
                        if (index > -1) {
                            listaKoopas.splice(index, 1);
                        }
                        listaCaparazones.push(nuevoCaparazon);
                        // Mover sprite del grupo `koopas` a `caparazonesGroup`
                        try {
                            koopas.remove(koopa.getSprite());
                            caparazonesGroup.add(nuevoCaparazon.getSprite());
                        } catch (e) {
                            console.warn('No se pudo mover sprite entre grupos (caparazon->koopa):', e);
                        }
                        
                        ws.enviarKoopaEstado({
                            codigo: codigo,
                            koopaId: koopa.getId(),
                            estado: 'caparazon',
                            velocidad: nuevoCaparazon.getVelocidad()
                        });
                    }
                });
                
                // Colisión entre caparazones
                listaCaparazones.forEach(otroCaparazon => {
                    if (otroCaparazon !== caparazon && otroCaparazon.isActivo() && 
                        caparazon.cooldownRebote <= 0 && otroCaparazon.cooldownRebote <= 0 &&
                        checkOverlap(caparazonSprite, otroCaparazon.getSprite())) {
                        
                        let otroEnMovimiento = otroCaparazon.estaEnMovimiento();
                        
                        if (otroEnMovimiento) {
                            // Dos caparazones EN MOVIMIENTO: verificar que se estén acercando
                            let vel1 = caparazon.getVelocidad();
                            let vel2 = otroCaparazon.getVelocidad();
                            let x1 = caparazonSprite.x;
                            let x2 = otroCaparazon.getSprite().x;
                            
                            let seEstanAcercando = (x1 < x2 && vel1 > 0 && vel2 < 0) ||
                                                   (x1 > x2 && vel1 < 0 && vel2 > 0);
                            
                            if (seEstanAcercando) {
                                console.log("¡Dos caparazones en movimiento chocaron y rebotaron!");
                                
                                // Activar cooldown en ambos
                                caparazon.cooldownRebote = 500;
                                otroCaparazon.cooldownRebote = 500;
                                
                                // Invertir direcciones de ambos caparazones
                                caparazon.invertirDireccion();
                                otroCaparazon.invertirDireccion();
                                
                                // Sincronizar ambos caparazones
                                ws.enviarKoopaEstado({
                                    codigo: codigo,
                                    koopaId: caparazon.getId(),
                                    estado: 'caparazon',
                                    velocidad: caparazon.getVelocidad()
                                });
                                
                                ws.enviarKoopaEstado({
                                    codigo: codigo,
                                    koopaId: otroCaparazon.getId(),
                                    estado: 'caparazon',
                                    velocidad: otroCaparazon.getVelocidad()
                                });
                            }
                        } else {
                            // Caparazón en movimiento choca con caparazón PARADO
                            // Solo el que está en movimiento rebota, el parado sigue parado
                            console.log("¡Caparazón en movimiento rebotó contra uno parado!");
                            
                            caparazon.cooldownRebote = 500;
                            caparazon.invertirDireccion();
                            
                            // Sincronizar solo el que rebotó
                            ws.enviarKoopaEstado({
                                codigo: codigo,
                                koopaId: caparazon.getId(),
                                estado: 'caparazon',
                                velocidad: caparazon.getVelocidad()
                            });
                        }
                    }
                });
            }
        });
        
        // === DETECCIÓN DE COLISIÓN CON PLANTAS PIRAÑA ===
        if (!jugadorPrincipal.esInvulnerable()) {
            plantasPirana.forEach(planta => {
                if (planta.activa && planta.visible) {
                    // Verificar colisión con el cuerpo o la cabeza de la planta
                    let playerBounds = player.getBounds();
                    let cuerpoPlantaBounds = planta.cuerpo.getBounds();
                    let cabezaPlantaBounds = planta.cabeza.getBounds();
                    
                    let colisionCuerpo = Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, cuerpoPlantaBounds);
                    let colisionCabeza = Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, cabezaPlantaBounds);
                    
                    if (colisionCuerpo || colisionCabeza) {
                        console.log("¡Colisión con Planta Piraña! Perdiendo vida...");
                        perderVida();
                    }
                }
            });
        }
        
        // === SINCRONIZACIÓN SUAVE DEL OTRO JUGADOR ===
        if (jugadorRemoto && jugadorRemoto.esVisible()) {
            jugadorRemoto.interpolar(time);
        }
        
        // Movimiento del jugador
        jugadorPrincipal.mover(cursors, jumpPressed, reboteEnemigo);
        let resultadoSalto = jugadorPrincipal.saltar(cursors, jumpPressed, reboteEnemigo);
        jumpPressed = resultadoSalto.jumpPressed;
        reboteEnemigo = resultadoSalto.reboteEnemigo;

        // === DETECCIÓN DE MONEDAS ===
        // Comprobar colisión con cada moneda activa
        monedas.forEach(moneda => {
            if (moneda.isActiva()) {
                let monedaSprite = moneda.getSprite();
                let distancia = Phaser.Math.Distance.Between(player.x, player.y, monedaSprite.x, monedaSprite.y);
                if (distancia < 20) { // Radio de colisión (jugador 32px + moneda 8px)
                    recogerMoneda(moneda);
                }
            }
        });

        // Enviar posición al servidor (throttle cada 20ms para sincronización precisa)
        if (time - lastUpdate > 20) {
            let pos = jugadorPrincipal.getPosicion();
            ws.enviarPosicion({
                codigo: codigo,
                x: pos.x,
                y: pos.y
            });
            lastUpdate = time;
        }
    }

    this.destruir = function() {
        console.log("Destruyendo juego Phaser");
        if (game) {
            game.destroy(true);
            // Limpiar listeners de WebSocket
            ws.socket.off("actualizacionJuego");
            ws.socket.off("actualizacionPuntuacion");
            ws.socket.off("monedaRecogida");
            ws.socket.off("goombaEliminado");
            ws.socket.off("koopaEstadoCambiado");
        }
    };
}
