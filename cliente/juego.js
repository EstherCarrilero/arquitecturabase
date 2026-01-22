function Juego() {
    const config = {
        type: Phaser.AUTO,
        width: 1100,
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
    
    // Sistema de puntos
    let puntosJugador = 0; // Puntos del jugador principal
    let puntosOtro = 0; // Puntos del otro jugador
    let comboEnemigos = 0; // Contador de enemigos derrotados sin tocar suelo
    let enElAire = false; // Flag para detectar si está en el aire
    let textoMiPuntuacionTens, textoMiPuntuacionUnits, textoOtroPuntuacionTens, textoOtroPuntuacionUnits; // Textos en pantalla (decenas + unidades)
    let textoMiVidas, textoOtraVidas; // Textos de vidas

    // Helper para actualizar un sprite dígito del HUD (muestra sólo la cifra de las unidades)
    function setHudDigit(sprite, number) {
        const n = Math.max(0, Math.min(9, Math.floor(number) % 10));
        if (sprite && typeof sprite.setTexture === 'function') {
            sprite.setTexture('hud_character_' + n);
        }
    }

    // Helper para actualizar dos sprites dígito del HUD (decenas + unidades)
    function setHudTwoDigits(spriteTens, spriteUnits, number) {
        const n = Math.max(0, Math.min(99, Math.floor(number)));
        const tens = Math.floor(n / 10) % 10;
        const units = n % 10;
        if (spriteTens && typeof spriteTens.setTexture === 'function') {
            spriteTens.setTexture('hud_character_' + tens);
        }
        if (spriteUnits && typeof spriteUnits.setTexture === 'function') {
            spriteUnits.setTexture('hud_character_' + units);
        }
    }
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
    
    // Variables de meta
    let bandera, mastilBandera;
    let jugadorEnMeta = false;
    let otroJugadorEnMeta = false;
    let timeoutVictoria = null; // Timeout de 10 segundos para victoria automática
    let victoriaMostrada = false; // Evitar mostrar modal de victoria múltiples veces
    
    // Variable de nivel
    let nivelActual = 1; // 1 = Fácil, 2 = Difícil
    
    // Flag para evitar mostrar "Has muerto" si ambos jugadores mueren
    let esperandoAmbosJugadoresMuertos = false;

    this.iniciar = function(codigoPartida) {
        codigo = codigoPartida;
        console.log("Iniciando juego Phaser con código de partida:", codigo);
        
        // Verificar si hay un nivel temporal guardado
        if (typeof window.nivelTemporal !== 'undefined') {
            nivelActual = window.nivelTemporal;
            delete window.nivelTemporal; // Limpiar temporal
            console.log("Nivel configurado desde temporal:", nivelActual);
        }
        
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
        console.log("Phaser: preload - cargando assets de jugador");
        // Cargar imágenes separadas para el jugador (128x128 cada una)
        this.load.image('player-front', 'cliente/assets/images/character_yellow_front.png');
        this.load.image('player-idle', 'cliente/assets/images/character_yellow_idle.png');
        this.load.image('player-walk-a', 'cliente/assets/images/character_yellow_walk_a.png');
        this.load.image('player-walk-b', 'cliente/assets/images/character_yellow_walk_b.png');
        this.load.image('player-jump', 'cliente/assets/images/character_yellow_jump.png');
        this.load.image('player-hit', 'cliente/assets/images/character_yellow_hit.png');
        // Left-facing variants for yellow player
        this.load.image('player-front-left', 'cliente/assets/images/character_yellow_front_left.png');
        this.load.image('player-idle-left', 'cliente/assets/images/character_yellow_idle_left.png');
        this.load.image('player-walk-a-left', 'cliente/assets/images/character_yellow_walk_a_left.png');
        this.load.image('player-walk-b-left', 'cliente/assets/images/character_yellow_walk_b_left.png');
        this.load.image('player-jump-left', 'cliente/assets/images/character_yellow_jump_left.png');
        this.load.image('player-hit-left', 'cliente/assets/images/character_yellow_hit_left.png');
        // Cargar versión rosa para el jugador remoto
        this.load.image('player-pink-front', 'cliente/assets/images/character_pink_front.png');
        this.load.image('player-pink-idle', 'cliente/assets/images/character_pink_idle.png');
        this.load.image('player-pink-walk-a', 'cliente/assets/images/character_pink_walk_a.png');
        this.load.image('player-pink-walk-b', 'cliente/assets/images/character_pink_walk_b.png');
        this.load.image('player-pink-jump', 'cliente/assets/images/character_pink_jump.png');
        this.load.image('player-pink-hit', 'cliente/assets/images/character_pink_hit.png');
        // Left-facing variants for pink player
        this.load.image('player-pink-front-left', 'cliente/assets/images/character_pink_front_left.png');
        this.load.image('player-pink-idle-left', 'cliente/assets/images/character_pink_idle_left.png');
        this.load.image('player-pink-walk-a-left', 'cliente/assets/images/character_pink_walk_a_left.png');
        this.load.image('player-pink-walk-b-left', 'cliente/assets/images/character_pink_walk_b_left.png');
        this.load.image('player-pink-jump-left', 'cliente/assets/images/character_pink_jump_left.png');
        this.load.image('player-pink-hit-left', 'cliente/assets/images/character_pink_hit_left.png');
        // Ground tiles
        this.load.image('ground_top', 'cliente/assets/images/terrain_grass_block_top.png');
        this.load.image('ground_top_left', 'cliente/assets/images/terrain_grass_block_top_left.png');
        this.load.image('ground_top_right', 'cliente/assets/images/terrain_grass_block_top_right.png');
        this.load.image('ground_center', 'cliente/assets/images/terrain_grass_block_center.png');
        this.load.image('ground_left', 'cliente/assets/images/terrain_grass_block_left.png');
        this.load.image('ground_right', 'cliente/assets/images/terrain_grass_block_right.png');
        this.load.image('ground_bottom', 'cliente/assets/images/terrain_grass_block_bottom.png');
        this.load.image('ground_bottom_left', 'cliente/assets/images/terrain_grass_block_bottom_left.png');
        this.load.image('ground_bottom_right', 'cliente/assets/images/terrain_grass_block_bottom_right.png');
        // Koopa / snail sprites
        this.load.image('snail_shell', 'cliente/assets/images/snail_shell.png');
        this.load.image('snail_rest', 'cliente/assets/images/snail_rest.png');
        this.load.image('snail_walk_a', 'cliente/assets/images/snail_walk_a.png');
        this.load.image('snail_walk_b', 'cliente/assets/images/snail_walk_b.png');
        // Right-facing variants for Koopa/snail
        this.load.image('snail_rest_right', 'cliente/assets/images/snail_rest_right.png');
        this.load.image('snail_shell_right', 'cliente/assets/images/snail_shell_right.png');
        this.load.image('snail_walk_a_right', 'cliente/assets/images/snail_walk_a_right.png');
        this.load.image('snail_walk_b_right', 'cliente/assets/images/snail_walk_b_right.png');
        // Goomba / slime sprites
        this.load.image('slime-flat', 'cliente/assets/images/slime_fire_flat.png');
        this.load.image('slime-rest', 'cliente/assets/images/slime_fire_rest.png');
        this.load.image('slime-walk-a', 'cliente/assets/images/slime_fire_walk_a.png');
        this.load.image('slime-walk-b', 'cliente/assets/images/slime_fire_walk_b.png');
        // Right-facing variants
        this.load.image('slime-flat-right', 'cliente/assets/images/slime_fire_flat_right.png');
        this.load.image('slime-rest-right', 'cliente/assets/images/slime_fire_rest_right.png');
        this.load.image('slime-walk-a-right', 'cliente/assets/images/slime_fire_walk_a_right.png');
        this.load.image('slime-walk-b-right', 'cliente/assets/images/slime_fire_walk_b_right.png');
        // Champiñón (star) sprite
        this.load.image('star', 'cliente/assets/images/star.png');
        // Coin sprites
        this.load.image('coin_gold', 'cliente/assets/images/coin_gold.png');
        this.load.image('coin_gold_side', 'cliente/assets/images/coin_gold_side.png');
        // HUD sprites (player icons, coin icon, multiplier and digits)
        this.load.image('hud_player_yellow', 'cliente/assets/images/hud_player_yellow.png');
        this.load.image('hud_player_pink', 'cliente/assets/images/hud_player_pink.png');
        this.load.image('hud_coin', 'cliente/assets/images/hud_coin.png');
        this.load.image('hud_character_multiply', 'cliente/assets/images/hud_character_multiply.png');
        this.load.image('hud_character_0', 'cliente/assets/images/hud_character_0.png');
        this.load.image('hud_character_1', 'cliente/assets/images/hud_character_1.png');
        this.load.image('hud_character_2', 'cliente/assets/images/hud_character_2.png');
        this.load.image('hud_character_3', 'cliente/assets/images/hud_character_3.png');
        this.load.image('hud_character_4', 'cliente/assets/images/hud_character_4.png');
        this.load.image('hud_character_5', 'cliente/assets/images/hud_character_5.png');
        this.load.image('hud_character_6', 'cliente/assets/images/hud_character_6.png');
        this.load.image('hud_character_7', 'cliente/assets/images/hud_character_7.png');
        this.load.image('hud_character_8', 'cliente/assets/images/hud_character_8.png');
        this.load.image('hud_character_9', 'cliente/assets/images/hud_character_9.png');
        // Flag sprites
        this.load.image('flag_off_center', 'cliente/assets/images/flag_off_center.png');
        this.load.image('flag_off_bottom', 'cliente/assets/images/flag_off_bottom.png');
        this.load.image('flag_red_a', 'cliente/assets/images/flag_red_a.png');
        this.load.image('flag_red_b', 'cliente/assets/images/flag_red_b.png');
        // Plantas piraña sprites (fish used as piranha visuals)
        this.load.image('fish_purple_down', 'cliente/assets/images/fish_purple_down.png');
        this.load.image('fish_purple_up', 'cliente/assets/images/fish_purple_up.png');
        // Tubería/Pipe sprites adicionales
        this.load.image('terrain_grass_vertical_top', 'cliente/assets/images/terrain_grass_vertical_top.png');
        this.load.image('water_top', 'cliente/assets/images/water_top.png');
        // Background images
        this.load.image('bg-solid-sky', 'cliente/assets/images/background_solid_sky.png');
        this.load.image('bg-fade-trees', 'cliente/assets/images/background_fade_trees.png');
        this.load.image('bg-solid-cloud', 'cliente/assets/images/background_solid_cloud.png');
        this.load.image('bg-clouds', 'cliente/assets/images/background_clouds.png');
        // Block sprites
        this.load.image('bricks_brown', 'cliente/assets/images/bricks_brown.png');
        this.load.image('block_planks', 'cliente/assets/images/block_planks.png');
        this.load.image('block_exclamation', 'cliente/assets/images/block_exclamation.png');
        this.load.image('block_exclamation_active', 'cliente/assets/images/block_exclamation_active.png');
    }

    function create() {
        console.log("Phaser: create");
        
        // Cargar el nivel seleccionado (por defecto nivel 1)
        cargarNivel.call(this, nivelActual);
        // Animaciones del jugador (usando imágenes separadas)
        this.anims.create({
            key: 'player-walk',
            frames: [ { key: 'player-walk-a' }, { key: 'player-walk-b' } ],
            frameRate: 8,
            repeat: -1
        });

        // Idle/Front
        this.anims.create({
            key: 'player-idle',
            frames: [ { key: 'player-front' }, { key: 'player-idle' } ],
            frameRate: 1,
            repeat: -1
        });

        // Jump (single frame)
        this.anims.create({
            key: 'player-jump',
            frames: [ { key: 'player-jump' } ],
            frameRate: 1,
            repeat: -1
        });

        // Hit (single frame)
        this.anims.create({
            key: 'player-hit',
            frames: [ { key: 'player-hit' } ],
            frameRate: 1,
            repeat: 0
        });

        // Left-facing player animations
        this.anims.create({
            key: 'player-walk-left',
            frames: [ { key: 'player-walk-a-left' }, { key: 'player-walk-b-left' } ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'player-idle-left',
            frames: [ { key: 'player-front-left' }, { key: 'player-idle-left' } ],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'player-jump-left',
            frames: [ { key: 'player-jump-left' } ],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'player-hit-left',
            frames: [ { key: 'player-hit-left' } ],
            frameRate: 1,
            repeat: 0
        });

        // Animaciones para el jugador rosa (otro jugador)
        this.anims.create({
            key: 'player-pink-walk',
            frames: [ { key: 'player-pink-walk-a' }, { key: 'player-pink-walk-b' } ],
            frameRate: 8,
            repeat: -1
        });

        // Left-facing animations for pink player
        this.anims.create({
            key: 'player-pink-walk-left',
            frames: [ { key: 'player-pink-walk-a-left' }, { key: 'player-pink-walk-b-left' } ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'player-pink-idle-left',
            frames: [ { key: 'player-pink-front-left' }, { key: 'player-pink-idle-left' } ],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'player-pink-jump-left',
            frames: [ { key: 'player-pink-jump-left' } ],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'player-pink-hit-left',
            frames: [ { key: 'player-pink-hit-left' } ],
            frameRate: 1,
            repeat: 0
        });

        this.anims.create({
            key: 'player-pink-idle',
            frames: [ { key: 'player-pink-front' }, { key: 'player-pink-idle' } ],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'player-pink-jump',
            frames: [ { key: 'player-pink-jump' } ],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'player-pink-hit',
            frames: [ { key: 'player-pink-hit' } ],
            frameRate: 1,
            repeat: 0
        });

        // Koopa/snail animations
        this.anims.create({
            key: 'koopa-walk',
            frames: [ { key: 'snail_walk_a' }, { key: 'snail_walk_b' } ],
            frameRate: 6,
            repeat: -1
        });
        // Right-facing koopa animations
        this.anims.create({
            key: 'koopa-walk-right',
            frames: [ { key: 'snail_walk_a_right' }, { key: 'snail_walk_b_right' } ],
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'koopa-rest',
            frames: [ { key: 'snail_rest' } ],
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'koopa-rest-right',
            frames: [ { key: 'snail_rest_right' } ],
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'shell-idle',
            frames: [ { key: 'snail_shell' } ],
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'shell-idle-right',
            frames: [ { key: 'snail_shell_right' } ],
            frameRate: 1,
            repeat: -1
        });

        // Goomba / slime animations
        this.anims.create({
            key: 'goomba-walk',
            frames: [ { key: 'slime-walk-a' }, { key: 'slime-walk-b' } ],
            frameRate: 6,
            repeat: -1
        });
        // Right-facing goomba animations
        this.anims.create({
            key: 'goomba-walk-right',
            frames: [ { key: 'slime-walk-a-right' }, { key: 'slime-walk-b-right' } ],
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'goomba-rest',
            frames: [ { key: 'slime-rest' } ],
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'goomba-rest-right',
            frames: [ { key: 'slime-rest-right' } ],
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'goomba-flat',
            frames: [ { key: 'slime-flat' } ],
            frameRate: 1,
            repeat: 0
        });
        this.anims.create({
            key: 'goomba-flat-right',
            frames: [ { key: 'slime-flat-right' } ],
            frameRate: 1,
            repeat: 0
        });

        // Controles
        cursors = this.input.keyboard.createCursorKeys();

        console.log("Juego creado correctamente");
    }
    
    // Función para cargar un nivel específico
    function cargarNivel(numero) {
        console.log("Cargando nivel", numero);

        // Variables de plataforma que pueden ser referenciadas por otras secciones
        let baseWidth, secondWidth, secondStartX, thirdWidth, thirdStartX, fourthWidth, fourthStartX;
        // Coordenadas compartidas para bloques/monedas ajustables
        let breakableRowStartX, breakableRowY;

        // === NIVEL 1 PLATFORM BUILDERS ===
        // createFirstFloorPlatform: top, top_right, right, center
        function createFirstFloorPlatform(scene, group, startX, bottomY, width, height = 64) {
            const tileW = 64;
            const tileH = 64;
            const cols = Math.max(1, Math.ceil(width / tileW));
            const rows = Math.max(1, Math.ceil(height / tileH));
            const topY = bottomY - height;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const px = startX + c * tileW + tileW / 2;
                    const py = topY + r * tileH + tileH / 2;
                    let key = 'ground_center';
                    
                    if (r === 0) {
                        // Top row
                        if (c === cols - 1) key = 'ground_top_right';
                        else key = 'ground_top';
                    } else if (c === cols - 1) {
                        // Right edge (not top row)
                        key = 'ground_right';
                    }

                    const tile = scene.add.image(px, py, key).setOrigin(0.5, 0.5);
                    scene.physics.add.existing(tile, true);
                    group.add(tile);
                }
            }
        }

        // createSecondFloorPlatform: top, top_left, top_right, left, right, center
        function createSecondFloorPlatform(scene, group, startX, bottomY, width, height = 64) {
            const tileW = 64;
            const tileH = 64;
            const cols = Math.max(1, Math.ceil(width / tileW));
            const rows = Math.max(1, Math.ceil(height / tileH));
            const topY = bottomY - height;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const px = startX + c * tileW + tileW / 2;
                    const py = topY + r * tileH + tileH / 2;
                    let key = 'ground_center';
                    
                    if (r === 0) {
                        // Top row
                        if (c === 0) key = 'ground_top_left';
                        else if (c === cols - 1) key = 'ground_top_right';
                        else key = 'ground_top';
                    } else {
                        // Not top row
                        if (c === 0) key = 'ground_left';
                        else if (c === cols - 1) key = 'ground_right';
                        else key = 'ground_center';
                    }

                    const tile = scene.add.image(px, py, key).setOrigin(0.5, 0.5);
                    scene.physics.add.existing(tile, true);
                    group.add(tile);
                }
            }
        }

        // createThirdFloorPlatform: top, top_left, top_right, left, right, center (same as second)
        function createThirdFloorPlatform(scene, group, startX, bottomY, width, height = 64) {
            const tileW = 64;
            const tileH = 64;
            const cols = Math.max(1, Math.ceil(width / tileW));
            const rows = Math.max(1, Math.ceil(height / tileH));
            const topY = bottomY - height;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const px = startX + c * tileW + tileW / 2;
                    const py = topY + r * tileH + tileH / 2;
                    let key = 'ground_center';
                    
                    if (r === 0) {
                        // Top row
                        if (c === 0) key = 'ground_top_left';
                        else if (c === cols - 1) key = 'ground_top_right';
                        else key = 'ground_top';
                    } else {
                        // Not top row
                        if (c === 0) key = 'ground_left';
                        else if (c === cols - 1) key = 'ground_right';
                        else key = 'ground_center';
                    }

                    const tile = scene.add.image(px, py, key).setOrigin(0.5, 0.5);
                    scene.physics.add.existing(tile, true);
                    group.add(tile);
                }
            }
        }

        // createFourthFloorPlatform: top, top_left, left, center (no right edge)
        function createFourthFloorPlatform(scene, group, startX, bottomY, width, height = 64) {
            const tileW = 64;
            const tileH = 64;
            const cols = Math.max(1, Math.ceil(width / tileW));
            const rows = Math.max(1, Math.ceil(height / tileH));
            const topY = bottomY - height;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const px = startX + c * tileW + tileW / 2;
                    const py = topY + r * tileH + tileH / 2;
                    let key = 'ground_center';
                    
                    if (r === 0) {
                        // Top row
                        if (c === 0) key = 'ground_top_left';
                        else key = 'ground_top';
                    } else {
                        // Not top row
                        if (c === 0) key = 'ground_left';
                        else key = 'ground_center';
                    }

                    const tile = scene.add.image(px, py, key).setOrigin(0.5, 0.5);
                    scene.physics.add.existing(tile, true);
                    group.add(tile);
                }
            }
        }

        // Generic helper for nivel 2 (backward compatibility)
        function createTiledPlatform(scene, group, centerX, centerY, width, height = 64) {
            const tileW = 64;
            const tileH = 64;
            const cols = Math.max(1, Math.ceil(width / tileW));
            const rows = Math.max(1, Math.ceil(height / tileH));
            const totalWidth = cols * tileW;
            let startX = centerX - totalWidth / 2 + tileW / 2;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const px = Math.round(startX + c * tileW);
                    const topEdge = centerY - height / 2;
                    const py = Math.round(topEdge + tileH / 2 + r * tileH);
                    let key = 'ground_center';
                    if (r === 0) {
                        if (c === cols - 1) key = 'ground_top_right';
                        else key = 'ground_top';
                    } else {
                        key = 'ground_center';
                    }
                    const tile = scene.add.image(px, py, key).setOrigin(0.5, 0.5);
                    scene.physics.add.existing(tile, true);
                    group.add(tile);
                }
            }
        }
        
        // === CONFIGURACIÓN DEL MUNDO Y CÁMARA ===
        // Expandir el mundo del juego (tamaño por nivel)
        const worldWidth = numero === 1 ? 4500 : 2400; // Nivel 1 más largo
        this.physics.world.setBounds(0, 0, worldWidth, 600);
        
        // Configurar cámara
        camara = this.cameras.main;
        camara.setBounds(0, 0, worldWidth, 600); // Límites de la cámara = límites del mundo

        // === PAREDES INVISIBLES EN LOS LÍMITES DEL MUNDO ===
        // Crear dos rectángulos invisibles a la izquierda y derecha para evitar que
        // jugadores/enemigos caigan fuera del mapa.
        try {
            const wallThickness = 40; // grosor de la pared invisible
            const worldHeight = 600;
            // Pared izquierda (justo fuera del borde x=0)
            const wallLeft = this.add.rectangle(-wallThickness/2, worldHeight/2, wallThickness, worldHeight, 0x000000, 0);
            this.physics.add.existing(wallLeft, true);
            // Pared derecha (justo fuera del borde x=worldWidth)
            const wallRight = this.add.rectangle(worldWidth + wallThickness/2, worldHeight/2, wallThickness, worldHeight, 0x000000, 0);
            this.physics.add.existing(wallRight, true);

            // Guardar referencias por si necesitamos accederlas luego
            this._worldWalls = { left: wallLeft, right: wallRight };
        } catch (e) {}
        
        // === FONDO POR CAPAS (solo nivel 1) ===
        if (numero === 1) {
            // Usar las dimensiones reales de las imágenes para apilar columnas verticales.
            const skyTex = this.textures.get('bg-solid-sky').getSourceImage();
            const cloudsTex = this.textures.get('bg-clouds').getSourceImage();
            const solidCloudTex = this.textures.get('bg-solid-cloud').getSourceImage();
            const treesTex = this.textures.get('bg-fade-trees').getSourceImage();

            const skyW = skyTex.width;
            const skyH = skyTex.height;
            const cloudsW = cloudsTex.width;
            const cloudsH = cloudsTex.height;
            const solidCloudW = solidCloudTex.width;
            const solidCloudH = solidCloudTex.height;
            const treesW = treesTex.width;
            const treesH = treesTex.height;

            // Para repetir columnas, usar el ancho máximo de las imágenes
            const columnWidth = Math.max(skyW, cloudsW, solidCloudW, treesW);

            // Profundidades: cielo más atrás, árboles más al frente
            const depthSky = -100;
            const depthClouds = -90;
            const depthSolidCloud = -80;
            const depthTrees = -70;

            // Para cada columna X, apilar las imágenes desde Y=0 hacia abajo: sky -> clouds -> solid_cloud -> trees
            for (let x = 0; x < worldWidth; x += columnWidth) {
                let y = 0;

                // Sky (parte superior de la columna)
                let sky = this.add.image(x, y, 'bg-solid-sky').setOrigin(0, 0);
                sky.setDepth(depthSky);
                y += skyH;

                // Clouds (debajo del sky)
                let clouds = this.add.image(x, y, 'bg-clouds').setOrigin(0, 0);
                clouds.setDepth(depthClouds);
                y += cloudsH;

                // Solid clouds (debajo de clouds)
                let solidCloud = this.add.image(x, y, 'bg-solid-cloud').setOrigin(0, 0);
                solidCloud.setDepth(depthSolidCloud);
                y += solidCloudH;

                // Fade trees (nivel del suelo)
                let trees = this.add.image(x, y, 'bg-fade-trees').setOrigin(0, 0);
                trees.setDepth(depthTrees);
                // y += treesH; // normalmente no necesitamos seguir más abajo
            }
        }
        
        // === SUELO Y PLATAFORMAS ===
        platforms = this.physics.add.staticGroup();
        
        if (numero === 1) {
            // NIVEL 1: Estructura escalonada de 4 plataformas
            const groundHeight = 64;
            baseWidth = 1200; // Ancho de referencia para la primera plataforma
            
            // Primera plataforma (parte más larga, base izquierda)
            createFirstFloorPlatform(this, platforms, 0, 600, baseWidth, groundHeight);
            
            // Segunda plataforma (más corta, con hueco antes)
            secondWidth = baseWidth * 0.6; // 60% de la primera
            secondStartX = baseWidth + 200; // Hueco de 200px
            createSecondFloorPlatform(this, platforms, secondStartX, 600, secondWidth, groundHeight);
            
            // Tercera plataforma (más pequeña, con hueco antes)
            thirdWidth = baseWidth * 0.65; // 65% de la primera
            thirdStartX = secondStartX + secondWidth + 200; // Hueco de 200px
            createThirdFloorPlatform(this, platforms, thirdStartX, 600, thirdWidth, groundHeight);
            
            // Cuarta plataforma (más pequeña, sin borde derecho)
            fourthWidth = baseWidth * 0.35; // 35% de la primera
            fourthStartX = thirdStartX + thirdWidth + 150; // Hueco de 100px
            createFourthFloorPlatform(this, platforms, fourthStartX, 600, fourthWidth, groundHeight);
            // Ajustar los bounds del mundo para que terminen donde acaba el suelo
            try {
                const finalWorldWidth = fourthStartX + fourthWidth; // El mundo no debe continuar más allá del suelo
                // Actualizar límites de física y cámara
                this.physics.world.setBounds(0, 0, finalWorldWidth, 600);
                if (camara) camara.setBounds(0, 0, finalWorldWidth, 600);

                // Reposicionar la pared derecha invisible si fue creada anteriormente
                try {
                    const wallThickness = 40;
                    const walls = this._worldWalls || {};
                    if (walls.right && typeof walls.right.setX === 'function') {
                        walls.right.setX(finalWorldWidth + wallThickness/2);
                        if (walls.right.body && typeof walls.right.body.updateFromGameObject === 'function') {
                            walls.right.body.updateFromGameObject();
                        }
                    }
                } catch (e) { /* no crítico */ }
            } catch (e) { /* no crítico */ }
            
        } else {
            // NIVEL 2 (DIFÍCIL): Múltiples huecos mortales
            let sueloNivel2 = [
                {x: 400, width: 800},    // Inicio
                // Hueco en x=800 (ancho 400)
                {x: 1200, width: 400},   // Sección media corta
                // Hueco en x=1400 (ancho 400)
                {x: 1800, width: 400},   // Otra sección corta
                // Hueco en x=2000 (ancho 200)
                {x: 2200, width: 400}    // Final
            ];
            sueloNivel2.forEach(seccion => {
                createTiledPlatform(this, platforms, seccion.x, 568, seccion.width, 64);
            });
            
            // Plataformas sobre los huecos (más pequeñas y difíciles)
            let plataformasPuenteNivel2 = [
                {x: 1000, y: 450, width: 200},
                {x: 1600, y: 420, width: 150},
                {x: 2100, y: 480, width: 180}
            ];
            plataformasPuenteNivel2.forEach(plat => {
                createTiledPlatform(this, platforms, plat.x, plat.y, plat.width, 32);
            });
        }
        
        // === BLOQUES FLOTANTES ===
        bloques = this.physics.add.staticGroup();
        bloquesRompibles = [];
        bloquesPregunta = [];
        
        let bloqueIdCounter = 0;
        
        if (numero === 1) {
            // NIVEL 1: Nueva configuración en tercera plataforma
            // Primera plataforma - Bloques flotantes: algunos normales, rompibles y un bloque de pregunta
            const firstPlatformStartX = 0;
            const firstBlockRowY = 300;
            // Fila de 4 bloques normales cerca del inicio
            for (let i = 0; i < 4; i++) {
                const bObj = new Bloque(this, firstPlatformStartX + 180 + i*32, firstBlockRowY, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
            }
            // Bloque de pregunta al final de la fila (champiñón)
            const bpObjA = new BloquePregunta(this, firstPlatformStartX + 180 + 4*32, firstBlockRowY, bloqueIdCounter++, 'champinon');
            let bloquePreguntaA = bpObjA.getSprite();
            bloques.add(bloquePreguntaA);
            bloquesPregunta.push(bloquePreguntaA);
            // Fila de bloques rompibles sobre la primera plataforma (encima del primer Goomba)
            breakableRowStartX = firstPlatformStartX + 400; // centrado aproximadamente sobre x=400
            breakableRowY = 200; // altura sobre el primer Goomba
            for (let i = 0; i < 3; i++) {
                const bR = new BloqueRompible(this, breakableRowStartX + i*32, breakableRowY, bloqueIdCounter++);
                let br = bR.getSprite();
                bloques.add(br);
                bloquesRompibles.push(br);
            }

            // Segunda plataforma - Bloques flotantes: fila + pregunta + bloque rompible
            const secondBlockRowY = 380;
            for (let i = 0; i < 3; i++) {
                const bObj = new Bloque(this, secondStartX + 50 + i*32, secondBlockRowY, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
            }
            const bpObjB = new BloquePregunta(this, secondStartX + 50 + 3*32, secondBlockRowY, bloqueIdCounter++, 'moneda');
            let bloquePreguntaB = bpObjB.getSprite();
            bloques.add(bloquePreguntaB);
            bloquesPregunta.push(bloquePreguntaB);
            
            // Tercera plataforma - Grupo 1: Fila de 3 bloques normales + 1 bloque pregunta (moneda) a altura media
            const thirdPlatformStartX = secondStartX + secondWidth + 200;
            const alturaMedia = 400; // Altura media sobre la tercera plataforma
            
            for (let i = 0; i < 3; i++) {
                const bObj = new Bloque(this, thirdPlatformStartX + 50 + i*32, alturaMedia, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
            }
            const bpObj1 = new BloquePregunta(this, thirdPlatformStartX + 50 + 3*32, alturaMedia, bloqueIdCounter++, 'moneda');
            let bloquePregunta1 = bpObj1.getSprite();
            bloques.add(bloquePregunta1);
            bloquesPregunta.push(bloquePregunta1);
            
            // Tercera plataforma - Grupo 2: Cuadrado de 6x6 bloques rompibles (vacío por dentro)
            const cuadradoStartX = thirdPlatformStartX + 280;
            const cuadradoStartY = 350;
            // Crear marco exterior de 6x6
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 6; col++) {
                    // Solo crear bloques en el borde (no rellenar el interior)
                    if (row === 0 || row === 5 || col === 0 || col === 5) {
                        const bObj = new BloqueRompible(this, cuadradoStartX + col*32, cuadradoStartY - row*32, bloqueIdCounter++);
                        let bloque = bObj.getSprite();
                        bloques.add(bloque);
                        bloquesRompibles.push(bloque);
                    }
                }
            }
            // Bloque de pregunta con champiñón en el centro del cuadrado
            const bpObj2 = new BloquePregunta(this, cuadradoStartX + 2.5*32, cuadradoStartY - 2.5*32, bloqueIdCounter++, 'champinon');
            let bloquePregunta2 = bpObj2.getSprite();
            bloques.add(bloquePregunta2);
            bloquesPregunta.push(bloquePregunta2);
            
            // Tercera plataforma - Grupo 3: Escalera de 4 peldaños en el borde derecho
            // Peldaños orientados hacia arriba-izquierda: filas desde arriba -> 1,2,3,4 bloques
            // Calcular el borde real en píxeles de la tercera plataforma (tiles de 64px)
            const thirdPlatformPixelWidth = Math.ceil(thirdWidth / 64) * 64;
            const escaleraStartX = thirdStartX + thirdPlatformPixelWidth - 20; // X del bloque más a la derecha (centro del último tile)
            const escaleraBaseY = 520; // Y base de la escalera (alineado con la parte superior del suelo)
            // Iterar por filas desde arriba (row=0) a abajo (row=3)
            for (let row = 0; row < 4; row++) {
                const blocksInRow = row + 1; // 1,2,3,4
                // Calcular Y: la fila superior está a escaleraBaseY - 3*32
                const y = escaleraBaseY - (3 - row) * 32;
                for (let i = 0; i < blocksInRow; i++) {
                    // Colocar bloques extendiéndose hacia la izquierda desde el borde
                    const x = escaleraStartX - i * 32;
                    const bObj = new Bloque(this, x, y, bloqueIdCounter++);
                    let bloque = bObj.getSprite();
                    bloques.add(bloque);
                }
            }
            
            // Cuarta plataforma - Escalera de 4 peldaños espejada al principio
            const fourthPlatformStartX = thirdStartX + thirdWidth + 100;
            const escaleraEspejadaStartX = fourthPlatformStartX + 65;
            const escaleraEspejadaBaseY = 520;
            for (let escalon = 0; escalon < 4; escalon++) {
                // Escalera espejada: peldaño más alto tiene más bloques
                const peldanoActual = 3 - escalon; // Invertir orden
                for (let col = 0; col <= peldanoActual; col++) {
                    const bObj = new Bloque(this, escaleraEspejadaStartX + col*32, escaleraEspejadaBaseY - escalon*32, bloqueIdCounter++);
                    let bloque = bObj.getSprite();
                    bloques.add(bloque);
                }
            }
            
        } else {
            // NIVEL 2 (DIFÍCIL): Bloques más dispersos y difíciles de alcanzar
            
            // Grupo 1: Bloques altos al inicio
            for (let i = 0; i < 2; i++) {
                const bObj = new BloqueRompible(this, 300 + i*32, 300, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
                bloquesRompibles.push(bloque);
            }

            const bpObj1 = new BloquePregunta(this, 364, 300, bloqueIdCounter++, 'moneda');
            let bloquePregunta1 = bpObj1.getSprite();
            bloques.add(bloquePregunta1);
            bloquesPregunta.push(bloquePregunta1);
            
            
            // Grupo 2: Bloques sobre primer hueco
            for (let i = 0; i < 3; i++) {
                const bObj = new Bloque(this, 950 + i*32, 350, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
            }
            
            // Grupo 3: Trampa - bloques rompibles sobre el vacío
            for (let i = 0; i < 3; i++) {
                const bObj = new BloqueRompible(this, 1500 + i*32, 280, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
                bloquesRompibles.push(bloque);
            }
            
            const bpObj2 = new BloquePregunta(this, 1596, 280, bloqueIdCounter++, 'champinon');
            let bloquePregunta2 = bpObj2.getSprite();
            bloques.add(bloquePregunta2);
            bloquesPregunta.push(bloquePregunta2);
            
            
            // Grupo 4: Plataforma alta y lejana
            for (let i = 0; i < 5; i++) {
                const bObj = new Bloque(this, 1900 + i*32, 220, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
            }
            
            // Grupo 5: Bloques de pregunta final
            const bpObj3 = new BloquePregunta(this, 2100, 380, bloqueIdCounter++, 'moneda');
            let bloquePregunta3 = bpObj3.getSprite();
            bloques.add(bloquePregunta3);
            bloquesPregunta.push(bloquePregunta3);
            
        }
        
        // === TUBOS VERDES (estilo Mario) ===
        tubos = this.physics.add.staticGroup();
        let listaTuberias = []; // Array de instancias Tuberia
        
        let datosTubos = [];
        if (numero === 1) {
            // NIVEL 1: Tubos más accesibles
            datosTubos = [
                {x: 250, altura: 80},
                {x: 700, altura: 120},
                {x: 1100, altura: 100},
                {x: 1650, altura: 140},
                {x: 2050, altura: 80}
            ];
        } else {
            // NIVEL 2: Tubos más altos y peligrosos
            datosTubos = [
                {x: 350, altura: 160},
                {x: 850, altura: 140},
                {x: 1250, altura: 120},
                {x: 1700, altura: 180},
                {x: 2000, altura: 160}
            ];
        }
        
        datosTubos.forEach(tuboData => {
            const tuberia = new Tuberia(this, tuboData.x, tuboData.altura);
            listaTuberias.push(tuberia);
            
            // Agregar sprites sólidos al grupo de colisión (excluye agua)
            tuberia.getSpritesColision().forEach(sprite => {
                tubos.add(sprite);
            });
        });

        // Añadir dos bloques de pregunta encima de la tercera tubería (índice 2)
        try {
            if (listaTuberias[2]) {
                const tubo3X = datosTubos[2].x;
                const preguntasY = 300; // altura donde se colocan los bloques
                // Colocar los dos bloques juntos, centrados sobre la tubería
                const bpOver1 = new BloquePregunta(this, tubo3X - 16, preguntasY, bloqueIdCounter++, 'moneda');
                let bloquePreguntaOver1 = bpOver1.getSprite();
                bloques.add(bloquePreguntaOver1);
                bloquesPregunta.push(bloquePreguntaOver1);

                const bpOver2 = new BloquePregunta(this, tubo3X + 16, preguntasY, bloqueIdCounter++, 'champinon');
                let bloquePreguntaOver2 = bpOver2.getSprite();
                bloques.add(bloquePreguntaOver2);
                bloquesPregunta.push(bloquePreguntaOver2);
            }
        } catch (e) { /* no crítico */ }
        
        // === PLANTAS PIRAÑA (rojas con verde) ===
        plantasPirana = [];
        
        let tubosConPlantas = [];
        if (numero === 1) {
            // NIVEL 1: Menos plantas
            tubosConPlantas = [
                datosTubos[1], // Segundo tubo
                datosTubos[3]  // Cuarto tubo
            ];
        } else {
            // NIVEL 2: Más plantas piraña
            tubosConPlantas = [
                datosTubos[0], // Primer tubo
                datosTubos[2], // Tercer tubo
                datosTubos[3], // Cuarto tubo
                datosTubos[4]  // Quinto tubo
            ];
        }
        
        tubosConPlantas.forEach((tuboData, index) => {
            // Obtener la tubería correspondiente
            const tuberia = listaTuberias[datosTubos.indexOf(tuboData)];
            if (!tuberia) return; // protección
            const waterY = tuberia.getWaterTopY();
            if (waterY == null) return; // protección

            // Crear una instancia de PlantaPirana (la clase maneja la apariencia)
            try {
                const plantaObj = new PlantaPirana(this, tuboData.x, waterY);
                plantasPirana.push(plantaObj);
            } catch (e) {
                console.warn('No se pudo crear PlantaPirana:', e);
            }
        });
        
        // === ESCALERAS (eliminadas - no tienen textura) ===
        escaleras = this.physics.add.staticGroup();
        // Las escaleras han sido reemplazadas por bloques normales en forma de escalera
        
        // === MONEDAS (amarillo brillante) ===
        monedas = [];
        let monedaId = 0;
        
        if (numero === 1) {
            // NIVEL 1: Más monedas y más accesibles
            // Primera fila de monedas ahora encima de la fila de bloques rompibles
            monedas.push(...Moneda.crearLinea(this, breakableRowStartX, breakableRowY - 40, 3, 32, monedaId));
            monedaId += 3;
            monedas.push(...Moneda.crearLinea(this, 840, 300, 5, 32, monedaId));
            monedaId += 5;
            // Fila de monedas sobre el primer hueco entre primera y segunda plataforma
            const gapCenterX = Math.round(((baseWidth + secondStartX) / 2) - 56); // centrar en el hueco
            monedas.push(...Moneda.crearLinea(this, gapCenterX, 470, 5, 32, monedaId));
            monedaId += 5;
            monedas.push(...Moneda.crearLinea(this, 1800, 310, 4, 32, monedaId));
            monedaId += 4;
        } else {
            // NIVEL 2: Menos monedas y más dispersas
            monedas.push(...Moneda.crearLinea(this, 400, 250, 3, 32, monedaId));
            monedaId += 3;
            monedas.push(...Moneda.crearLinea(this, 1000, 310, 3, 32, monedaId));
            monedaId += 3;
            monedas.push(...Moneda.crearLinea(this, 1600, 380, 4, 32, monedaId));
            monedaId += 4;
            monedas.push(...Moneda.crearLinea(this, 2000, 180, 3, 32, monedaId));
            monedaId += 3;
        }
        
        // === ENEMIGOS GOOMBA (marrones) ===
        goombas = this.physics.add.group();
        
        // Crear Goombas distribuidos por el nivel usando la clase
        let posicionesGoombas = [];
        if (numero === 1) {
            // Nivel 1 (Fácil): pocos enemigos
            posicionesGoombas = [
                {x: 400, y: 500},
                {x: 1400, y: 500},
                // Nueva posición: entre la 4ª (x=1650) y 5ª tubería (x=2050)
                {x: 1750, y: 500}
            ];
        } else {
            // Nivel 2 (Difícil): más enemigos
            posicionesGoombas = [
                {x: 400, y: 500},
                {x: 800, y: 500},
                {x: 1200, y: 500},
                {x: 1600, y: 500},
                {x: 2000, y: 500}
            ];
        }
        
        let goombasArray = Goomba.crearGoombas(this, posicionesGoombas);
        goombasArray.forEach(goomba => {
            goombas.add(goomba.getSprite());
        });
        
        // === ENEMIGOS KOOPA (tortugas verdes) ===
        koopas = this.physics.add.group();
        
        // Crear Koopas distribuidos por el nivel usando la clase
        let posicionesKoopas = [];
            if (numero === 1) {
            // Nivel 1 (Fácil): Koopas incluyendo uno dentro del cuadrado de bloques rompibles
            // Recalcular el inicio real del cuadrado (coincide con la creación anterior)
            const cuadradoStartX = thirdStartX + 280;
            const cuadradoStartY = 350;
            posicionesKoopas = [
                {x: 800, y: 500},
                // Koopa entre la 4ª y 5ª tubería
                {x: 1850, y: 500},
                {x: cuadradoStartX + 2.5 * 32, y: cuadradoStartY - 2.5 * 32} // Koopa dentro del cuadrado (centro)
            ];
        } else {
            // Nivel 2 (Difícil): más Koopas
            posicionesKoopas = [
                {x: 500, y: 500},
                {x: 800, y: 500},
                {x: 1100, y: 500},
                {x: 1300, y: 500},
                {x: 1750, y: 500},
                {x: 2100, y: 500}
            ];
        }
        
        listaKoopas = Koopa.crearKoopas(this, posicionesKoopas);
        listaKoopas.forEach(koopa => {
            koopas.add(koopa.getSprite());
        });

        // Grupo separado para caparazones (inicialmente vacío)
        caparazonesGroup = this.physics.add.group();


        // === POWER-UPS: CHAMPIÑONES ===
        champinones = this.physics.add.group();
        
        // Crear champiñones en posiciones específicas (sobre plataformas) usando la clase
        let posicionesChampi = [];
        if (numero === 1) {
            // Nivel 1 (Fácil): más champiñones
            posicionesChampi = [
                //{x: 300, y: 450},   // Cerca del inicio
                {x: 900, y: 300}   // Sobre una plataforma media
                //{x: 1200, y: 450},
                //{x: 1500, y: 450}
            ];
        } else {
            // Nivel 2 (Difícil): menos champiñones
            posicionesChampi = [
                {x: 900, y: 300},   // Sobre una plataforma media
                {x: 1800, y: 450}
            ];
        }
        
        let champinonesArray = Champinon.crearChampinones(this, posicionesChampi);
        champinonesArray.forEach(champinon => {
            champinones.add(champinon.getSprite());
        });

        // === BANDERA DE META (al final del nivel) ===
        // Para nivel 1, colocar al final de la cuarta plataforma
        let metaX = numero === 1 ? (fourthStartX + fourthWidth - 100) : 2300;
        let metaY = 568;
        
        // Bandera de meta (clase Bandera)
        let zonaMeta = null;
        try {
            const banderaObj = new Bandera(this, metaX, metaY);
            mastilBandera = banderaObj.getMastil();
            zonaMeta = banderaObj.getZonaMeta();
            // Asegurar que la zona tenga cuerpo físico
            try { this.physics.add.existing(zonaMeta, true); } catch (e) {}
            try { zonaMeta.isMeta = true; } catch (e) {}
        } catch (e) {
            // Fallback: crear mástil y zona como antes si la clase no está disponible
            mastilBandera = this.add.rectangle(metaX, metaY - 150, 8, 300, 0x666666);
            zonaMeta = this.add.rectangle(metaX, metaY - 100, 80, 400, 0x00ff00, 0);
            this.physics.add.existing(zonaMeta, true);
            zonaMeta.isMeta = true;
        }

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
        
        // Overlap con la zona de meta
        this.physics.add.overlap(player, zonaMeta, llegarAMeta, null, this);
        
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

        // Colisiones con paredes invisibles del mundo (si existen)
        try {
            const walls = this._worldWalls || {};
            if (walls.left) {
                this.physics.add.collider(player, walls.left);
                this.physics.add.collider(goombas, walls.left);
                this.physics.add.collider(koopas, walls.left);
                this.physics.add.collider(caparazonesGroup, walls.left);
                this.physics.add.collider(champinones, walls.left);
            }
            if (walls.right) {
                this.physics.add.collider(player, walls.right);
                this.physics.add.collider(goombas, walls.right);
                this.physics.add.collider(koopas, walls.right);
                this.physics.add.collider(caparazonesGroup, walls.right);
                this.physics.add.collider(champinones, walls.right);
            }
        } catch (e) {}
        
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
        // Aumentado horizontalmente para que el jugador tenga más visión lateral
        camara.setDeadzone(200, 100);
        // Lerp: suavizado del movimiento de la cámara
        camara.setLerp(0.1, 0.1);

        // Crear otro jugador usando la clase OtroJugador
        jugadorRemoto = new OtroJugador(this, 100, 450, 0x0000ff);
        otroJugador = jugadorRemoto.getSprite();
        
        // ¡COLISIÓN ENTRE JUGADORES! - No se atraviesan
        this.physics.add.collider(player, otroJugador);
        
        // === INTERFAZ DE PUNTUACIÓN (estilo Mario Bros) ===
        // Línea 1: Jugador 1 (amarillo) - usar sprites HUD

        // Jugador principal icono (movido un poco a la izquierda)
        let hudIconMi = this.add.image(36, 28, 'hud_player_yellow').setScale(0.6);
        hudIconMi.setScrollFactor(0);
        hudIconMi.setDepth(100);

        // Multiplicador 'x' para vidas (más cerca del dígito)
        let hudMiMultiply = this.add.image(68, 28, 'hud_character_multiply').setScale(0.6);
        hudMiMultiply.setScrollFactor(0);
        hudMiMultiply.setDepth(100);

        // Dígito de vidas (inicialmente 3)
        textoMiVidas = this.add.image(88, 28, 'hud_character_3').setScale(0.6);
        textoMiVidas.setScrollFactor(0);
        textoMiVidas.setDepth(100);

        // Icono de moneda y dígito (inicialmente 0)
        let hudCoinMi = this.add.image(152, 28, 'hud_coin').setScale(0.6);
        hudCoinMi.setScrollFactor(0);
        hudCoinMi.setDepth(100);

        // Dos sprites para mostrar decenas + unidades de monedas
        textoMiPuntuacionTens = this.add.image(174, 28, 'hud_character_0').setScale(0.6);
        textoMiPuntuacionUnits = this.add.image(192, 28, 'hud_character_0').setScale(0.6);
        textoMiPuntuacionTens.setScrollFactor(0);
        textoMiPuntuacionUnits.setScrollFactor(0);
        textoMiPuntuacionTens.setDepth(100);
        textoMiPuntuacionUnits.setDepth(100);

        // Línea 2: Jugador 2 (rosa) - usar sprites HUD
        let hudIconOtro = this.add.image(36, 70, 'hud_player_pink').setScale(0.6);
        hudIconOtro.setScrollFactor(0);
        hudIconOtro.setDepth(100);

        let hudOtroMultiply = this.add.image(68, 70, 'hud_character_multiply').setScale(0.6);
        hudOtroMultiply.setScrollFactor(0);
        hudOtroMultiply.setDepth(100);

        textoOtraVidas = this.add.image(88, 70, 'hud_character_3').setScale(0.6);
        textoOtraVidas.setScrollFactor(0);
        textoOtraVidas.setDepth(100);

        let hudCoinOtro = this.add.image(152, 70, 'hud_coin').setScale(0.6);
        hudCoinOtro.setScrollFactor(0);
        hudCoinOtro.setDepth(100);

        // Dos sprites para mostrar decenas + unidades del otro jugador
        textoOtroPuntuacionTens = this.add.image(174, 70, 'hud_character_0').setScale(0.6);
        textoOtroPuntuacionUnits = this.add.image(192, 70, 'hud_character_0').setScale(0.6);
        textoOtroPuntuacionTens.setScrollFactor(0);
        textoOtroPuntuacionUnits.setScrollFactor(0);
        textoOtroPuntuacionTens.setDepth(100);
        textoOtroPuntuacionUnits.setDepth(100);
        
        // Aplicar configuración específica del nivel
        if (numero === 1) {
            console.log("Nivel 1 (Fácil) cargado");
        } else if (numero === 2) {
            console.log("Nivel 2 (Difícil) cargado");
        }
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
                // Solo mostrar si el otro jugador no está marcado como muerto
                try {
                    if (typeof jugadorRemoto.esMuerto === 'function') {
                        if (!jugadorRemoto.esMuerto()) jugadorRemoto.mostrar();
                    } else {
                        // Fallback: usar la propiedad sprite
                        if (otroJugador && !otroJugador.muerto) otroJugador.visible = true;
                    }
                } catch (e) {
                    // En caso de error, mantener comportamiento anterior
                    otroJugador.visible = true;
                }

                // Actualizar posición objetivo usando la clase
                jugadorRemoto.actualizarPosicion(datos.x, datos.y);
            }
        });
        
        // Recibir puntuación del rival
        ws.socket.on("actualizacionPuntuacion", function(datos) {
            if (datos) {
                if (typeof datos.puntuacion !== 'undefined') {
                    puntuacionOtro = datos.puntuacion;
                    if (textoOtroPuntuacionTens) {
                        setHudTwoDigits(textoOtroPuntuacionTens, textoOtroPuntuacionUnits, puntuacionOtro);
                    }
                }
                // Si vienen los puntos totales, mantener puntosOtro sincronizado
                if (typeof datos.puntos !== 'undefined') {
                    puntosOtro = datos.puntos;
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

        // Recibir notificación de jugador muerto (ocultar al otro jugador)
        ws.socket.on("jugadorMuerto", function(datos) {
            console.log("Evento jugadorMuerto recibido:", datos);
            if (datos && datos.codigo === codigo) {
                if (jugadorRemoto) {
                    try {
                        // Preferir usar la API del objeto remoto si existe
                        if (typeof jugadorRemoto.morir === 'function') {
                            jugadorRemoto.morir();
                        } else {
                            // Ocultar y desactivar el sprite del otro jugador
                            otroJugador.visible = false;
                            if (otroJugador.body) {
                                otroJugador.body.enable = false;
                            }
                            if (jugadorRemoto.setVisible) jugadorRemoto.setVisible(false);
                        }
                        console.log("Otro jugador ocultado por muerte remota");
                    } catch (e) {
                        console.warn('Error al ocultar otro jugador:', e);
                    }
                }
            }
        });
        
        // Recibir notificación de que ambos jugadores han muerto
        ws.socket.on("ambosJugadoresMuertos", function(datos) {
            console.log("Evento ambosJugadoresMuertos recibido:", datos);
            if (datos && datos.codigo === codigo) {
                // Marcar flag para cancelar modal individual si estaba pendiente
                esperandoAmbosJugadoresMuertos = false;
                // Mostrar modal de GAME OVER con opciones Reintentar/Salir
                mostrarModalAmbosJugadoresMuertos();
            }
        });
        
        // Recibir champiñones recogidos por el rival
        ws.socket.on("champinonRecogido", function(datos) {
            console.log("Champiñón recogido por otro jugador (ID:", datos.champinonId, ")", datos.x ? ('pos=' + datos.x + ',' + datos.y) : '');
            // Intentar eliminar por ID
            try {
                let ok = eliminarChampinon(datos.champinonId);
                if (!ok) {
                    // Si no se encontró por ID, intentar eliminar por proximidad (coordenadas opcionales)
                    if (typeof datos.x !== 'undefined' && typeof datos.y !== 'undefined') {
                        let mejor = null;
                        let mejorDist = Infinity;
                        champinones.getChildren().forEach(champiSprite => {
                            if (!champiSprite.champRef || !champiSprite.champRef.isActivo()) return;
                            let dx = (champiSprite.x || 0) - datos.x;
                            let dy = (champiSprite.y || 0) - datos.y;
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d < mejorDist) { mejorDist = d; mejor = champiSprite; }
                        });
                        // Si la distancia es razonable, recogerlo
                        if (mejor && mejorDist < 64) {
                            try { mejor.champRef.recoger(); console.log('Champiñón eliminado por proximidad (dist=', mejorDist, ')'); } catch(e) {}
                        } else {
                            console.warn('No se encontró champiñón remoto por ID ni por proximidad');
                        }
                    } else {
                        console.warn('No se encontró champiñón remoto por ID y no se proporcionaron coordenadas');
                    }
                }
            } catch (e) {
                console.warn('Error al procesar champinonRecogido:', e);
            }
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
                    // Generar fragmentos visuales localmente para mostrar la ruptura
                    try { createBlockFragments(bloque); } catch(e) {}
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
                    try {
                        if (typeof bloque.setTexture === 'function') {
                            // Es un sprite: poner textura inactiva
                            bloque.setTexture('block_exclamation');
                        } else if (typeof bloque.setFillStyle === 'function') {
                            // Es un rectángulo antiguo: cambiar color a marrón
                            bloque.setFillStyle(0x8B4513);
                        }
                    } catch (e) {}
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
                        // Crear moneda usando la clase Moneda con el ID proporcionado
                        try {
                            let idNuevo = (typeof datos.monedaId !== 'undefined') ? datos.monedaId : (monedas.reduce((max, m) => Math.max(max, m.getId()), -1) + 1);
                            let monedaNueva = new Moneda(game.scene.scenes[0], datos.x, datos.y - 20, idNuevo);
                            monedas.push(monedaNueva);

                            // Añadir física visual para el efecto de salida (opcional)
                            try {
                                game.scene.scenes[0].physics.add.existing(monedaNueva.getSprite());
                                monedaNueva.getSprite().body.setVelocityY(-250);
                                monedaNueva.getSprite().body.setGravityY(800);
                            } catch (e) {
                                // continuar sin física si falla
                            }

                            // Eliminar moneda después de animación (no incrementar puntuación local)
                            setTimeout(() => {
                                monedaNueva.destroy();
                            }, 500);
                        } catch (e) {
                            console.warn('Error al crear moneda remota desde bloque:', e);
                        }
                    }
                }
            });
        });
        
        // Recibir cambios de estado grande/pequeño del rival
        ws.socket.on("estadoGrandeCambiado", function(datos) {
            console.log("Estado grande del otro jugador cambiado:", datos.grande);
            if (jugadorRemoto) {
                // Si el rival pierde el powerup, mostrar golpe
                try {
                    if (otroJugadorGrande && !datos.grande) {
                        if (typeof jugadorRemoto.recibirGolpe === 'function') jugadorRemoto.recibirGolpe();
                    }
                } catch(e) {}
                jugadorRemoto.actualizarTamaño(datos.grande);
                console.log("Otro jugador actualizado en pantalla - Grande:", datos.grande);
            }
            // Actualizar estado almacenado
            try { otroJugadorGrande = !!datos.grande; } catch(e) {}
        });
        
        // Recibir cambios de vidas del rival
        ws.socket.on("vidasActualizadas", function(datos) {
            console.log("Vidas del otro jugador actualizadas:", datos.vidas);
            if (textoOtraVidas) {
                setHudDigit(textoOtraVidas, datos.vidas);
            }
            try {
                if (typeof vidasOtro !== 'undefined' && datos.vidas < vidasOtro) {
                    if (jugadorRemoto && typeof jugadorRemoto.recibirGolpe === 'function') jugadorRemoto.recibirGolpe();
                }
            } catch(e) {}
            // Actualizar contador local
            try { vidasOtro = datos.vidas; } catch(e) {}
        });
        
        // Recibir notificación de que el otro jugador llegó a la meta
        ws.socket.on("jugadorLlegoMeta", function(datos) {
            console.log("Otro jugador llegó a la meta:", datos);
            otroJugadorEnMeta = true;
            if (datos.puntos !== undefined) {
                puntosOtro = datos.puntos;
            }
            // Si ambos han llegado, cancelar timeout y mostrar victoria
            if (jugadorEnMeta && otroJugadorEnMeta) {
                // Cancelar timeout si existía
                if (timeoutVictoria) {
                    clearTimeout(timeoutVictoria);
                    timeoutVictoria = null;
                    console.log("Timeout de victoria cancelado - segundo jugador llegó a tiempo");
                }
                if (!victoriaMostrada) {
                    victoriaMostrada = true;
                    mostrarVictoria();
                }
            }
        });

        // Recibir notificación de victoria por timeout (mostrar victoria a ambos jugadores)
        ws.socket.on("victoriaTimeout", function(datos) {
            console.log("Evento victoriaTimeout recibido:", datos);
            // Marcar que el otro jugador llegó (para consistencia) y mostrar victoria
            otroJugadorEnMeta = true;
            // No sobrescribir `puntosOtro` desde este evento (podría ser el propio remitente).
            // `puntosOtro` debería venir sincronizado mediante "actualizacionPuntuacion".
            if (!victoriaMostrada) {
                victoriaMostrada = true;
                mostrarVictoria();
            }
        });
        
        console.log("Listeners WebSocket configurados");
    }
    // Función para recoger monedas
    function recogerMoneda(moneda) {
        moneda.recoger(); // Usa el método de la clase Moneda
        puntuacionJugador++;
        setHudTwoDigits(textoMiPuntuacionTens, textoMiPuntuacionUnits, puntuacionJugador);
        
        // Sumar 200 puntos por moneda
        puntosJugador += 200;
        console.log("¡Moneda recogida! ID:", moneda.getId(), "Total monedas:", puntuacionJugador, "Puntos:", puntosJugador);
        
        // Enviar actualización de puntuación al servidor
        ws.enviarPuntuacion({
            codigo: codigo,
            puntuacion: puntuacionJugador,
            puntos: puntosJugador
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
        let margen = 10;
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
            
            // Incrementar combo y calcular puntos (solo si es Koopa caminando, no caparazón)
            if (koopa) {
                comboEnemigos++;
                let puntosGanados = calcularPuntosCombo(comboEnemigos);
                puntosJugador += puntosGanados;
                console.log("Combo x" + comboEnemigos + " - Puntos ganados:", puntosGanados, "Total:", puntosJugador);
            }
            
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
        // Intentar usar displayHeight del bloque si está disponible
        let bloqueHalfHeight = (bloque.displayHeight && bloque.displayHeight > 0) ? bloque.displayHeight / 2 : 15;
        let bloqueBaseY = bloque.y + bloqueHalfHeight; // estimación de la base del bloque

        let distanciaVertical = Math.abs(jugadorCabezaY - bloqueBaseY);
        let distanciaHorizontal = Math.abs(jugador.x - bloque.x);

        // Umbrales usados para la detección
        const umbralVertical = 12; // px
        const umbralHorizontal = (jugador.displayWidth / 2) + 20;

        // Logs de depuración
        try {
            console.debug('[checkOverlapVertical] jugador.x=', jugador.x, 'jugador.y=', jugador.y, 'displayWidth=', jugador.displayWidth, 'displayHeight=', jugador.displayHeight);
            console.debug('[checkOverlapVertical] jugadorCabezaY=', jugadorCabezaY);
            console.debug('[checkOverlapVertical] bloque.x=', bloque.x, 'bloque.y=', bloque.y, 'bloque.displayHeight=', bloque.displayHeight, 'bloqueHalfHeight=', bloqueHalfHeight);
            console.debug('[checkOverlapVertical] distanciaVertical=', distanciaVertical, 'distanciaHorizontal=', distanciaHorizontal, 'umbralV=', umbralVertical, 'umbralH=', umbralHorizontal);
        } catch (e) {
            console.warn('[checkOverlapVertical] error al loguear:', e);
        }

        const resultado = distanciaVertical < umbralVertical && distanciaHorizontal < umbralHorizontal;
        console.debug('[checkOverlapVertical] resultado=', resultado);
        return resultado;
    }
    
    // Función para calcular puntos según combo
    function calcularPuntosCombo(combo) {
        switch(combo) {
            case 1: return 200;
            case 2: return 400;
            case 3: return 800;
            case 4: return 1000;
            case 5: return 2000;
            default: return combo >= 6 ? 4000 : 0;
        }
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
            
            // Incrementar combo y calcular puntos
            comboEnemigos++;
            let puntosGanados = calcularPuntosCombo(comboEnemigos);
            puntosJugador += puntosGanados;
            console.log("Combo x" + comboEnemigos + " - Puntos ganados:", puntosGanados, "Total:", puntosJugador);
            
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
        
        // Actualizar HUD de vidas (sprite-dígito)
        setHudDigit(textoMiVidas, jugadorPrincipal.getVidas());
        
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
        let encontrado = false;
        champinones.getChildren().forEach(champiSprite => {
            if (encontrado) return;
            if (champiSprite.champRef && champiSprite.champRef.getId() === champiId) {
                champiSprite.champRef.recoger();
                encontrado = true;
            }
        });
        return encontrado;
    }
    
    // Función para romper bloque
    // Crear fragmentos visuales para la ruptura de un bloque (no envía WS)
    function createBlockFragments(bloque) {
        try {
            for (let i = 0; i < 4; i++) {
                let fragmento = game.scene.scenes[0].add.rectangle(
                    bloque.x + (i % 2) * 8 - 4,
                    bloque.y + Math.floor(i / 2) * 8 - 4,
                    8, 8, 0xCC6600
                );
                game.scene.scenes[0].physics.add.existing(fragmento);
                fragmento.body.setVelocity(
                    (Math.random() - 0.5) * 200,
                    -200 - Math.random() * 100
                );
                fragmento.body.setGravityY(800);
                setTimeout(() => { try { fragmento.destroy(); } catch(e){} }, 1000);
            }
        } catch (e) {}
    }

    function romperBloque(bloque) {
        if (bloque.roto) return;

        bloque.roto = true;
        bloque.visible = false;
        bloque.body.enable = false;

        console.log("¡Bloque roto! ID:", bloque.id);

        // Crear fragmentos visuales localmente
        try { createBlockFragments(bloque); } catch (e) {}

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
        // Cambiar visual: si es un rectángulo antiguo usar setFillStyle, si es un sprite usar textura 'active'
        try {
            if (typeof bloque.setFillStyle === 'function') {
                // rectángulo antiguo: cambiar color a marrón
                bloque.setFillStyle(0x8B4513);
            } else if (typeof bloque.setTexture === 'function') {
                // sprite: cambiar a la versión INACTIVA tras ser usado
                bloque.setTexture('block_exclamation');
            }
        } catch (e) {}
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
            // Crear moneda usando la clase Moneda y asignar un ID único
            let nuevoId = monedas.reduce((max, m) => Math.max(max, m.getId()), -1) + 1;
            let monedaNueva = new Moneda(game.scene.scenes[0], bloque.x, bloque.y - 20, nuevoId);
            monedas.push(monedaNueva);

            // Añadir física visual para el efecto de salida (opcional)
            try {
                game.scene.scenes[0].physics.add.existing(monedaNueva.getSprite());
                monedaNueva.getSprite().body.setVelocityY(-250);
                monedaNueva.getSprite().body.setGravityY(800);
            } catch (e) {
                // continuar sin física si falla
            }

            // Recoger moneda después de animación (esto incrementa la puntuación local y notifica)
            setTimeout(() => {
                recogerMoneda(monedaNueva);
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
        let payload = {
            codigo: codigo,
            bloqueId: bloque.id,
            contenido: bloque.contenido,
            x: bloque.x,
            y: bloque.y
        };
        if (bloque.contenido === 'moneda') {
            // Incluir el ID de la moneda creada para que el otro cliente la sincronice
            payload.monedaId = monedas.length ? monedas[monedas.length - 1].getId() : undefined;
        }
        ws.enviarBloqueGolpeado(payload);
    }
    
    // Función para recoger champiñón
    function recogerChampinon(champiSprite) {
        if (!champiSprite.champRef) return;
        let champi = champiSprite.champRef;
        
        if (!champi.isActivo()) return;
        
        console.log("¡Champiñón recogido! Jugador crece.");
        
        // Sumar 1000 puntos por champiñón
        puntosJugador += 1000;
        
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
        
        // Enviar también posición para facilitar sincronización si los IDs difieren
        try {
            let spr = champi.getSprite ? champi.getSprite() : null;
            ws.enviarChampinonRecogido({
                codigo: codigo,
                champinonId: champi.getId(),
                x: spr ? spr.x : undefined,
                y: spr ? spr.y : undefined
            });
        } catch (e) {
            ws.enviarChampinonRecogido({ codigo: codigo, champinonId: champi.getId() });
        }
        
        console.log("Estado jugador grande:", jugadorPrincipal.esGrande());
    }
    
    // Función cuando el jugador llega a la meta
    function llegarAMeta(jugador, zonaMeta) {
        if (jugadorEnMeta || jugadorPrincipal.esMuerto()) return; // Ya está en meta o muerto
        
        jugadorEnMeta = true;
        console.log("¡Jugador local llegó a la meta!");
        
        // Detectar altura al tocar la bandera y dar bonus
        let alturaJugador = jugador.y;
        let bonusAltura = 0;
        let ganóVida = false;
        
            if (alturaJugador <= 300) {
            // Punta del poste (arriba)
            bonusAltura = 5000;
            ganóVida = true;
            jugadorPrincipal.vidas++; // Ganar una vida extra
            if (textoMiVidas) setHudDigit(textoMiVidas, jugadorPrincipal.getVidas());
            console.log("¡Bonus punta del poste! +5000 puntos y +1 vida");
        } else if (alturaJugador <= 450) {
            // Parte media
            bonusAltura = 2000;
            console.log("¡Bonus parte media! +2000 puntos");
        } else {
            // Parte inferior
            bonusAltura = 400;
            console.log("¡Bonus parte inferior! +400 puntos");
        }
        
        puntosJugador += bonusAltura;
        console.log("Puntos totales:", puntosJugador);
        
        // Animar deslizamiento por la bandera
        animarDeslizamientoBandera(jugador);
        
        // Notificar al servidor con los puntos
        ws.enviarJugadorLlegoMeta({ codigo: codigo, puntos: puntosJugador });
        
        // Si el otro jugador ya llegó, mostrar victoria inmediata
        if (otroJugadorEnMeta) {
            // Cancelar timeout si existía
            if (timeoutVictoria) {
                clearTimeout(timeoutVictoria);
                timeoutVictoria = null;
                console.log("Timeout de victoria cancelado - ambos jugadores llegaron");
            }
            if (!victoriaMostrada) {
                victoriaMostrada = true;
                mostrarVictoria();
            }
        } else {
            // Iniciar temporizador de 10 segundos para victoria automática
            console.log("Iniciando temporizador de 10 segundos para victoria...");
            timeoutVictoria = setTimeout(function() {
                console.log("¡Tiempo agotado! Mostrando victoria automática");
                timeoutVictoria = null;
                if (!victoriaMostrada) {
                    victoriaMostrada = true;
                    // Notificar al servidor para que reenvíe la victoria a ambos jugadores
                    try { ws.enviarVictoriaTimeout({ codigo: codigo, puntos: puntosJugador }); } catch (e) { console.warn('Error enviando victoriaTimeout:', e); }
                    mostrarVictoria();
                }
            }, 10000); // 10 segundos
        }
    }
    
    // Función para animar el deslizamiento por la bandera
    function animarDeslizamientoBandera(jugador) {
        // Desactivar controles del jugador (si es el jugador local, usar la API de la instancia)
        try {
            if (jugadorPrincipal && jugador === jugadorPrincipal.getSprite() && typeof jugadorPrincipal.setControlsEnabled === 'function') {
                jugadorPrincipal.setControlsEnabled(false);
            } else {
                if (jugador.body) {
                    jugador.body.setVelocity(0, 0);
                    jugador.body.setAllowGravity(false);
                }
            }
        } catch (e) {
            console.warn('Error al desactivar controles para animación de bandera:', e);
        }
        
        // Posicionar al jugador en el mástil (usar la posición actual del mástil si existe)
        let metaX = (typeof mastilBandera !== 'undefined' && mastilBandera) ? mastilBandera.x : (numero === 1 ? 4300 : 2300);
        jugador.x = metaX;
        
        // Animar bajada suave por el mástil
        let intervalo = setInterval(() => {
            if (jugador.y < 520) {
                jugador.y += 2;
            } else {
                clearInterval(intervalo);
                // Al terminar, mover al jugador al lado derecho
                jugador.x = metaX + 50;
                try {
                    if (jugadorPrincipal && jugador === jugadorPrincipal.getSprite() && typeof jugadorPrincipal.setControlsEnabled === 'function') {
                        // Mantener controles deshabilitados hasta la victoria
                    } else if (jugador.body) {
                        jugador.body.setAllowGravity(true);
                    }
                } catch (e) {
                    console.warn('Error al finalizar animación de bandera:', e);
                }

                console.log("Jugador deslizó por la bandera y espera al otro lado");
            }
        }, 20);
    }
    
    // Función para mostrar pantalla de victoria
    function mostrarVictoria() {
        console.log("¡VICTORIA! Ambos jugadores llegaron a la meta");
        
        // Obtener la escena activa
        let scene = game.scene.scenes[0];
        if (!scene) return;

        // Ocultar y desactivar visualmente a ambos jugadores (mismo comportamiento que al morir)
        try {
            // Jugador local
            if (player) {
                if (player.setVisible) player.setVisible(false); else player.visible = false;
                if (player.setActive) player.setActive(false);

                if (player.body) {
                    try {
                        player.body.enable = false;
                        if (player.body.checkCollision) player.body.checkCollision.none = true;
                        if (typeof player.body.setSize === 'function') player.body.setSize(0, 0, false);
                    } catch (inner) {}
                }
            }

            // Instancia Jugador (por si el sprite está en la instancia)
            if (typeof jugadorPrincipal !== 'undefined' && jugadorPrincipal) {
                let spr = jugadorPrincipal.getSprite && jugadorPrincipal.getSprite();
                if (spr && spr !== player) {
                    if (spr.setVisible) spr.setVisible(false); else spr.visible = false;
                    if (spr.setActive) spr.setActive(false);
                    if (spr.body) {
                        spr.body.enable = false;
                        if (spr.body.checkCollision) spr.body.checkCollision.none = true;
                        if (typeof spr.body.setSize === 'function') spr.body.setSize(0, 0, false);
                    }
                }

                if (jugadorPrincipal.getIndicador) {
                    let ind = jugadorPrincipal.getIndicador();
                    if (ind) {
                        if (ind.setVisible) ind.setVisible(false); else ind.visible = false;
                        if (ind.body) ind.body.enable = false;
                    }
                }
            }

            // Otro jugador (remoto)
            if (otroJugador) {
                if (otroJugador.setVisible) otroJugador.setVisible(false); else otroJugador.visible = false;
                if (otroJugador.body) {
                    otroJugador.body.enable = false;
                    if (otroJugador.body.checkCollision) otroJugador.body.checkCollision.none = true;
                    if (typeof otroJugador.body.setSize === 'function') otroJugador.body.setSize(0, 0, false);
                }
            }

            if (jugadorRemoto && typeof jugadorRemoto.getSprite === 'function') {
                let spr2 = jugadorRemoto.getSprite();
                if (spr2 && spr2 !== otroJugador) {
                    if (spr2.setVisible) spr2.setVisible(false); else spr2.visible = false;
                    if (spr2.setActive) spr2.setActive(false);
                    if (spr2.body) {
                        spr2.body.enable = false;
                        if (spr2.body.checkCollision) spr2.body.checkCollision.none = true;
                        if (typeof spr2.body.setSize === 'function') spr2.body.setSize(0, 0, false);
                    }
                }
            }
        } catch (e) {
            console.warn('Error ocultando jugadores en victoria:', e);
        }

        // Asegurarse de que las instancias cancelen timers/estado interno (desactivar hitboxes internamente)
        try {
            if (jugadorPrincipal && typeof jugadorPrincipal.morir === 'function') {
                jugadorPrincipal.morir();
            }
        } catch (e) { console.warn('Error llamando jugadorPrincipal.morir() en victoria:', e); }

        try {
            if (jugadorRemoto && typeof jugadorRemoto.morir === 'function') {
                jugadorRemoto.morir();
            }
        } catch (e) { console.warn('Error llamando jugadorRemoto.morir() en victoria:', e); }

        // Centrar modal en la cámara
        let cam = scene.cameras.main;
        let cx = cam.centerX;
        let cy = cam.centerY;

        // Fondo semi-transparente que cubre toda la pantalla
        let overlay = scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.7).setOrigin(0.5);
        overlay.setScrollFactor(0);
        overlay.setDepth(1000);

        // Panel central del modal
        let modalBg = scene.add.rectangle(cx, cy, 450, 280, 0x2c3e50).setOrigin(0.5);
        modalBg.setScrollFactor(0);
        modalBg.setDepth(1001);
        modalBg.setStrokeStyle(4, 0xf39c12);

        // Título "¡VICTORIA!"
        let titulo = scene.add.text(cx, cy - 100, '¡VICTORIA!', {
            fontSize: '56px',
            fontStyle: 'bold',
            fill: '#f39c12',
            fontFamily: 'Arial'
        });
        titulo.setOrigin(0.5);
        titulo.setScrollFactor(0);
        titulo.setDepth(1002);

        // Mensaje
        let mensaje = scene.add.text(cx, cy - 40, 'Algún jugador ha llegado a la meta', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        });
        mensaje.setOrigin(0.5);
        mensaje.setScrollFactor(0);
        mensaje.setDepth(1002);

        // Determinar ganador
        let ganador = '';
        if (puntosJugador > puntosOtro) {
            ganador = '¡Tú ganaste!';
        } else if (puntosOtro > puntosJugador) {
            ganador = '¡El otro jugador ganó!';
        } else {
            ganador = '¡Empate!';
        }

        let textoGanador = scene.add.text(cx, cy - 5, ganador, {
            fontSize: '22px',
            fontStyle: 'bold',
            fill: puntosJugador > puntosOtro ? '#2ecc71' : (puntosOtro > puntosJugador ? '#e74c3c' : '#f39c12'),
            fontFamily: 'Arial'
        });
        textoGanador.setOrigin(0.5);
        textoGanador.setScrollFactor(0);
        textoGanador.setDepth(1002);

        // Puntuaciones
        let textoPuntosJugador = scene.add.text(cx, cy + 30, `Tus puntos: ${puntosJugador}`, {
            fontSize: '18px',
            fill: '#faba2d',
            fontFamily: 'Arial'
        });
        textoPuntosJugador.setOrigin(0.5);
        textoPuntosJugador.setScrollFactor(0);
        textoPuntosJugador.setDepth(1002);

        let textoPuntosOtro = scene.add.text(cx, cy + 55, `Puntos rival: ${puntosOtro}`, {
            fontSize: '18px',
            fill: '#ff8aae',
            fontFamily: 'Arial'
        });
        textoPuntosOtro.setOrigin(0.5);
        textoPuntosOtro.setScrollFactor(0);
        textoPuntosOtro.setDepth(1002);

        // Botón "Salir" (comportamiento igual que SALIR en Game Over)
        // Reducido y ligeramente más abajo para no tapar el texto
        let botonBg = scene.add.rectangle(cx, cy + 100, 120, 44, 0xe74c3c).setOrigin(0.5);
        botonBg.setScrollFactor(0);
        botonBg.setDepth(1002);
        botonBg.setInteractive({ useHandCursor: true });

        let botonTexto = scene.add.text(cx, cy + 100, 'SALIR', {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        botonTexto.setOrigin(0.5);
        botonTexto.setScrollFactor(0);
        botonTexto.setDepth(1003);

        // Efecto hover en el botón (rojo -> más oscuro)
        botonBg.on('pointerover', function() {
            botonBg.setFillStyle(0xc0392b);
        });
        botonBg.on('pointerout', function() {
            botonBg.setFillStyle(0xe74c3c);
        });

        // Al hacer clic en "Salir", notificar al servidor para terminar la partida
        botonBg.on('pointerdown', function() {
            console.log("Salir desde modal de victoria - enviando gameOverExit");
            if (ws && ws.enviarGameOverExit && codigo) {
                ws.enviarGameOverExit(codigo);
            }
        });
    }

    // Función de Game Over
    function gameOverFunc() {
        console.log("Game Over!");
        // Ocultar jugador local y desactivar su cuerpo/hitbox para desaparecer localmente
        try {
            // Ocultar/Desactivar el sprite referenciado por la variable `player`
            if (player) {
                if (player.setVisible) player.setVisible(false);
                else player.visible = false;

                if (player.setActive) player.setActive(false);

                // Desactivar el body (hitbox) de Arcade Physics si existe
                if (player.body) {
                    try {
                        player.body.enable = false;
                        // Evitar cualquier chequeo de colisión residual
                        if (player.body.checkCollision) player.body.checkCollision.none = true;
                        // Reducir el tamaño del body para garantizar que no colisione
                        if (typeof player.body.setSize === 'function') {
                            player.body.setSize(0, 0, false);
                        }
                    } catch (inner) {
                        console.warn('Error al desactivar body del jugador:', inner);
                    }
                }
            }

            // También intentar ocultar/desactivar a través de la instancia Jugador si existe
            if (typeof jugadorPrincipal !== 'undefined' && jugadorPrincipal) {
                let spr = jugadorPrincipal.getSprite && jugadorPrincipal.getSprite();
                if (spr && spr !== player) {
                    if (spr.setVisible) spr.setVisible(false); else spr.visible = false;
                    if (spr.setActive) spr.setActive(false);
                    if (spr.body) {
                        spr.body.enable = false;
                        if (spr.body.checkCollision) spr.body.checkCollision.none = true;
                        if (typeof spr.body.setSize === 'function') spr.body.setSize(0, 0, false);
                    }
                }

                // Ocultar indicador si existe
                if (jugadorPrincipal.getIndicador) {
                    let ind = jugadorPrincipal.getIndicador();
                    if (ind) {
                        if (ind.setVisible) ind.setVisible(false); else ind.visible = false;
                        if (ind.body) ind.body.enable = false;
                    }
                }
            }
        } catch (e) {
            console.warn('Error al ocultar jugador local en gameOver:', e);
        }

        // Asegurarse de que la instancia Jugador cancele timers y se desactive completamente
        try {
            if (jugadorPrincipal && typeof jugadorPrincipal.morir === 'function') {
                jugadorPrincipal.morir();
            }
        } catch (e) {
            console.warn('Error al invocar jugadorPrincipal.morir():', e);
        }

        // Notificar al servidor/otro jugador que este jugador ha muerto
        try {
            ws.enviarJugadorMuerto({ codigo: codigo });
        } catch (e) {
            console.warn('Error al notificar muerte al servidor:', e);
        }

        // Cambiar la cámara para que siga al otro jugador
        try {
            if (camara && otroJugador) {
                camara.stopFollow();
                camara.startFollow(otroJugador, true, 0.1, 0.1);
                console.log("Cámara ahora sigue al otro jugador");
            }
        } catch (e) {
            console.warn('Error al cambiar seguimiento de cámara:', e);
        }

        // Esperar un momento antes de mostrar el modal individual
        // para dar tiempo a que el servidor envíe "ambosJugadoresMuertos" si ambos murieron
        esperandoAmbosJugadoresMuertos = true;
        setTimeout(function() {
            // Solo mostrar "Has muerto" si no recibimos "ambosJugadoresMuertos"
            if (esperandoAmbosJugadoresMuertos) {
                esperandoAmbosJugadoresMuertos = false;
                mostrarModalGameOver();
            }
        }, 300); // 300ms de delay para recibir respuesta del servidor
    }

    function mostrarModalGameOver() {
        // Obtener la escena activa
        let scene = game.scene.scenes[0];
        if (!scene) return;

        // Centrar modal en la cámara
        let cam = scene.cameras.main;
        let cx = cam.centerX;
        let cy = cam.centerY;

        // Fondo semi-transparente que cubre toda la pantalla
        let overlay = scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.7).setOrigin(0.5);
        overlay.setScrollFactor(0);
        overlay.setDepth(1000);

        // Panel central del modal
        let modalBg = scene.add.rectangle(cx, cy, 400, 250, 0x2c3e50).setOrigin(0.5);
        modalBg.setScrollFactor(0);
        modalBg.setDepth(1001);
        modalBg.setStrokeStyle(4, 0xe74c3c);

        // Título "¡Has muerto!"
        let titulo = scene.add.text(cx, cy - 80, '¡Has muerto!', {
            fontSize: '48px',
            fontStyle: 'bold',
            fill: '#e74c3c',
            fontFamily: 'Arial'
        });
        titulo.setOrigin(0.5);
        titulo.setScrollFactor(0);
        titulo.setDepth(1002);

        // Mensaje
        let mensaje = scene.add.text(cx, cy - 20, 'Has perdido todas tus vidas', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        });
        mensaje.setOrigin(0.5);
        mensaje.setScrollFactor(0);
        mensaje.setDepth(1002);

        // Botón "Aceptar"
        let botonBg = scene.add.rectangle(cx, cy + 50, 150, 50, 0x27ae60).setOrigin(0.5);
        botonBg.setScrollFactor(0);
        botonBg.setDepth(1002);
        botonBg.setInteractive({ useHandCursor: true });

        let botonTexto = scene.add.text(cx, cy + 50, 'ACEPTAR', {
            fontSize: '24px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        botonTexto.setOrigin(0.5);
        botonTexto.setScrollFactor(0);
        botonTexto.setDepth(1003);

        // Efecto hover en el botón
        botonBg.on('pointerover', function() {
            botonBg.setFillStyle(0x2ecc71);
        });
        botonBg.on('pointerout', function() {
            botonBg.setFillStyle(0x27ae60);
        });

        // Al hacer clic en "Aceptar", cerrar el modal
        botonBg.on('pointerdown', function() {
            overlay.destroy();
            modalBg.destroy();
            titulo.destroy();
            mensaje.destroy();
            botonBg.destroy();
            botonTexto.destroy();
            console.log("Modal de muerte individual cerrado");
        });
    }
    
    function mostrarModalAmbosJugadoresMuertos() {
        // Modal cuando ambos jugadores han muerto
        let scene = game.scene.scenes[0];
        if (!scene) return;

        // Centrar modal en la cámara
        let cam = scene.cameras.main;
        let cx = cam.centerX;
        let cy = cam.centerY;

        // Fondo semi-transparente
        let overlay = scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.7).setOrigin(0.5);
        overlay.setScrollFactor(0);
        overlay.setDepth(1000);

        // Panel central del modal
        let modalBg = scene.add.rectangle(cx, cy, 450, 300, 0x2c3e50).setOrigin(0.5);
        modalBg.setScrollFactor(0);
        modalBg.setDepth(1001);
        modalBg.setStrokeStyle(4, 0xe74c3c);

        // Título "GAME OVER"
        let titulo = scene.add.text(cx, cy - 100, 'GAME OVER', {
            fontSize: '56px',
            fontStyle: 'bold',
            fill: '#e74c3c',
            fontFamily: 'Arial'
        });
        titulo.setOrigin(0.5);
        titulo.setScrollFactor(0);
        titulo.setDepth(1002);

        // Mensaje
        let mensaje = scene.add.text(cx, cy - 30, 'Ambos jugadores han muerto', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        });
        mensaje.setOrigin(0.5);
        mensaje.setScrollFactor(0);
        mensaje.setDepth(1002);

        // Botón "Salir" (única opción)
        let botonSalirBg = scene.add.rectangle(cx, cy + 50, 200, 60, 0xe74c3c).setOrigin(0.5);
        botonSalirBg.setScrollFactor(0);
        botonSalirBg.setDepth(1002);
        botonSalirBg.setInteractive({ useHandCursor: true });

        let botonSalirTexto = scene.add.text(cx, cy + 50, 'SALIR', {
            fontSize: '26px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        botonSalirTexto.setOrigin(0.5);
        botonSalirTexto.setScrollFactor(0);
        botonSalirTexto.setDepth(1003);

        // Efectos hover
        botonSalirBg.on('pointerover', function() {
            botonSalirBg.setFillStyle(0xc0392b);
        });
        botonSalirBg.on('pointerout', function() {
            botonSalirBg.setFillStyle(0xe74c3c);
        });

        // Botón Salir: enviar gameOverExit para que ambos jugadores vuelvan al menú
        botonSalirBg.on('pointerdown', function() {
            console.log("Salir de GAME OVER - enviando gameOverExit");
            // Enviar evento al servidor para eliminar partida y expulsar a ambos
            if (ws && ws.enviarGameOverExit && codigo) {
                ws.enviarGameOverExit(codigo);
            }
            // El cleanup se hará cuando llegue el evento del servidor
        });
    }

    let lastUpdate = 0;
    function update(time) {
        // === DETECCIÓN DE MUERTE POR CAÍDA AL VACÍO ===
        if (player && !jugadorPrincipal.esMuerto()) {
            // Si el jugador cae por debajo de la pantalla (y > 600), muere
            if (player.y > 600) {
                console.log("¡Jugador cayó al vacío!");

                // Forzar pérdida de todas las vidas al caer: game over inmediato
                let esGameOver = false;
                if (jugadorPrincipal && typeof jugadorPrincipal.perderTodasVidas === 'function') {
                    esGameOver = jugadorPrincipal.perderTodasVidas();
                    if (textoMiVidas) setHudDigit(textoMiVidas, jugadorPrincipal.getVidas());
                    // Notificar al servidor que las vidas han quedado en 0 para sincronizar HUD remoto
                    try { ws.enviarVidas({ codigo: codigo, vidas: jugadorPrincipal.getVidas() }); } catch(e) { console.warn('Error enviando vidas tras perderTodasVidas:', e); }
                } else if (jugadorPrincipal && typeof jugadorPrincipal.perderVida === 'function') {
                    // Fallback: si no existe el método, quitar todas las vidas manualmente
                    while (jugadorPrincipal.getVidas() > 0) jugadorPrincipal.perderVida();
                    esGameOver = true;
                    if (textoMiVidas) setHudDigit(textoMiVidas, jugadorPrincipal.getVidas());
                    try { ws.enviarVidas({ codigo: codigo, vidas: jugadorPrincipal.getVidas() }); } catch(e) { console.warn('Error enviando vidas tras fallback perderVida loop:', e); }
                } else {
                    // Fallback a variable legacy
                    if (typeof vidasJugador !== 'undefined') {
                        vidasJugador = 0;
                        if (textoMiVidas) setHudDigit(textoMiVidas, vidasJugador);
                        esGameOver = true;
                        try { ws.enviarVidas({ codigo: codigo, vidas: 0 }); } catch(e) { console.warn('Error enviando vidas tras fallback legacy:', e); }
                    }
                }

                // Ejecutar muerte visual/estado
                if (jugadorPrincipal && typeof jugadorPrincipal.morir === 'function') jugadorPrincipal.morir();

                // Usaremos la función centralizada de Game Over (oculta jugador, notifica servidor y cambia cámara)
                // Si no es Game Over (caso improbable aquí), se reviviría; pero en caídas forzamos Game Over.
                if (!esGameOver) {
                    setTimeout(() => {
                        // Resetear posición del jugador
                        player.x = 100;
                        player.y = 400;
                        if (player.body && typeof player.body.setVelocity === 'function') player.body.setVelocity(0, 0);

                        // Revivir al jugador
                        if (jugadorPrincipal && typeof jugadorPrincipal.revivir === 'function') jugadorPrincipal.revivir();
                        if (player.setVisible) player.setVisible(true); else player.visible = true;
                        if (playerIndicator) playerIndicator.visible = true;

                        console.log("Jugador revivido tras caída al vacío");
                    }, 2000);
                } else {
                    // Game Over: reutilizar la lógica existente
                    
                    gameOverFunc();
                }
            }
        }
        
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

            // Si la planta es una instancia moderna con método actualizar(), delegar
            if (typeof planta.actualizar === 'function') {
                planta.actualizar();
                return;
            }

            // Compatibilidad: lógica antigua para objetos con cuerpo/cabeza separados
            let tiempoActual = Date.now();
            let tiempoEnFase = tiempoActual - planta.cicloTiempo;

            if (planta.fase === 'escondida') {
                if (tiempoEnFase > planta.tiempoEscondida) {
                    planta.fase = 'subiendo';
                    planta.cicloTiempo = tiempoActual;
                }
            } else if (planta.fase === 'subiendo') {
                let progreso = Math.min(tiempoEnFase / 500, 1);
                let yActual = planta.yEscondida + (planta.yVisible - planta.yEscondida) * progreso;
                if (planta.cuerpo) planta.cuerpo.y = yActual;
                if (planta.cabeza) planta.cabeza.y = yActual - 25;

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
                let progreso = Math.min(tiempoEnFase / 500, 1);
                let yActual = planta.yVisible + (planta.yEscondida - planta.yVisible) * progreso;
                if (planta.cuerpo) planta.cuerpo.y = yActual;
                if (planta.cabeza) planta.cabeza.y = yActual - 25;

                if (progreso >= 1) {
                    planta.fase = 'escondida';
                    planta.visible = false;
                    planta.cicloTiempo = tiempoActual;
                }
            }
        });
        
        // === DETECCIÓN MANUAL DE COLISIÓN CON GOOMBAS ===
        if (!jugadorPrincipal.esInvulnerable() && !jugadorPrincipal.esMuerto()) {
            goombas.getChildren().forEach(goombaSprite => {
                if (goombaSprite.goombaRef && goombaSprite.goombaRef.isActivo() && checkOverlap(player, goombaSprite)) {
                    golpearGoomba(player, goombaSprite);
                }
            });
        }
        
        // === DETECCIÓN MANUAL DE COLISIÓN CON KOOPAS ===
        if (!jugadorPrincipal.esMuerto()) {
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
        }
        
        // === DETECCIÓN DE COLISIÓN CON CHAMPIÑONES ===
        if (!jugadorPrincipal.esMuerto()) {
            champinones.getChildren().forEach(champiSprite => {
                if (champiSprite.champRef && champiSprite.champRef.isActivo() && checkOverlap(player, champiSprite)) {
                    recogerChampinon(champiSprite);
                }
            });
        }
        
        // === DETECCIÓN DE GOLPE A BLOQUES DESDE ABAJO ===
        // Verificar si el jugador está saltando y golpea un bloque desde abajo
        if (!jugadorPrincipal.esMuerto() && player.body && player.body.velocity.y < 0) { // Subiendo (saltando)
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
        if (!jugadorPrincipal.esInvulnerable() && !jugadorPrincipal.esMuerto()) {
            plantasPirana.forEach(planta => {
                // Daño al jugador si la planta está activa, independientemente de su fase (escondida/subiendo/visible/bajando)
                if (planta.activa) {
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
        
        // Resetear combo si toca el suelo
        if (!jugadorPrincipal.esMuerto() && player.body && player.body.touching.down) {
            if (comboEnemigos > 0) {
                console.log("Combo reseteado (tocó el suelo)");
                comboEnemigos = 0;
            }
        }

        // === DETECCIÓN DE MONEDAS ===
        // Comprobar colisión con cada moneda activa
        if (!jugadorPrincipal.esMuerto()) {
            monedas.forEach(moneda => {
                if (moneda.isActiva()) {
                    let monedaSprite = moneda.getSprite();
                    let distancia = Phaser.Math.Distance.Between(player.x, player.y, monedaSprite.x, monedaSprite.y);
                    // Calcular radio de colisión dinámico usando tamaños del jugador y la moneda
                    const playerRadius = (player.displayWidth || 32) / 2;
                    const coinRadius = (monedaSprite.displayWidth || 24) / 2;
                    const collisionRadius = Math.max(20, playerRadius + coinRadius, 28); // mínimo razonable
                    if (distancia < collisionRadius) {
                        recogerMoneda(moneda);
                    }
                }
            });
        }

        // Enviar posición al servidor (throttle cada 20ms para sincronización precisa)
        if (!jugadorPrincipal.esMuerto() && time - lastUpdate > 20) {
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
            // Limpiar listeners de WebSocket añadidos por este juego
            try {
                ws.socket.off("actualizacionJuego");
                ws.socket.off("actualizacionPuntuacion");
                ws.socket.off("monedaRecogida");
                ws.socket.off("goombaEliminado");
                ws.socket.off("koopaEstadoCambiado");
                ws.socket.off("estadoGrandeCambiado");
                ws.socket.off("jugadorMuerto");
                ws.socket.off("ambosJugadoresMuertos");
                ws.socket.off("champinonRecogido");
                ws.socket.off("bloqueRoto");
                ws.socket.off("bloquePreguntaGolpeado");
                ws.socket.off("vidasActualizadas");
                ws.socket.off("jugadorLlegoMeta");
                ws.socket.off("victoriaTimeout");
            } catch (e) {
                console.warn('Error limpiando listeners WS en destruir():', e);
            }
        }
    };
}