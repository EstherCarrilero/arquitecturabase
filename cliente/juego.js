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
    
    // Sistema de puntos
    let puntosJugador = 0; // Puntos del jugador principal
    let puntosOtro = 0; // Puntos del otro jugador
    let comboEnemigos = 0; // Contador de enemigos derrotados sin tocar suelo
    let enElAire = false; // Flag para detectar si está en el aire
    let textoMiPuntuacion, textoOtroPuntuacion; // Textos en pantalla
    let textoMiVidas, textoOtraVidas; // Textos de vidas

    // Helper para actualizar un sprite dígito del HUD (muestra sólo la cifra de las unidades)
    function setHudDigit(sprite, number) {
        const n = Math.max(0, Math.min(9, Math.floor(number) % 10));
        if (sprite && typeof sprite.setTexture === 'function') {
            sprite.setTexture('hud_character_' + n);
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
    
    // Variable de nivel
    let nivelActual = 1; // 1 = Fácil, 2 = Difícil

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
        // Cargar versión rosa para el jugador remoto
        this.load.image('player-pink-front', 'cliente/assets/images/character_pink_front.png');
        this.load.image('player-pink-idle', 'cliente/assets/images/character_pink_idle.png');
        this.load.image('player-pink-walk-a', 'cliente/assets/images/character_pink_walk_a.png');
        this.load.image('player-pink-walk-b', 'cliente/assets/images/character_pink_walk_b.png');
        this.load.image('player-pink-jump', 'cliente/assets/images/character_pink_jump.png');
        this.load.image('player-pink-hit', 'cliente/assets/images/character_pink_hit.png');
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
        // Goomba / slime sprites
        this.load.image('slime-flat', 'cliente/assets/images/slime_fire_flat.png');
        this.load.image('slime-rest', 'cliente/assets/images/slime_fire_rest.png');
        this.load.image('slime-walk-a', 'cliente/assets/images/slime_fire_walk_a.png');
        this.load.image('slime-walk-b', 'cliente/assets/images/slime_fire_walk_b.png');
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

        // Animaciones para el jugador rosa (otro jugador)
        this.anims.create({
            key: 'player-pink-walk',
            frames: [ { key: 'player-pink-walk-a' }, { key: 'player-pink-walk-b' } ],
            frameRate: 8,
            repeat: -1
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
        this.anims.create({
            key: 'koopa-rest',
            frames: [ { key: 'snail_rest' } ],
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'shell-idle',
            frames: [ { key: 'snail_shell' } ],
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
        this.anims.create({
            key: 'goomba-rest',
            frames: [ { key: 'slime-rest' } ],
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'goomba-flat',
            frames: [ { key: 'slime-flat' } ],
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
            const baseWidth = 1200; // Ancho de referencia para la primera plataforma
            
            // Primera plataforma (parte más larga, base izquierda)
            createFirstFloorPlatform(this, platforms, 0, 600, baseWidth, groundHeight);
            
            // Segunda plataforma (más corta, con hueco antes)
            const secondWidth = baseWidth * 0.6; // 60% de la primera
            const secondStartX = baseWidth + 200; // Hueco de 200px
            createSecondFloorPlatform(this, platforms, secondStartX, 600, secondWidth, groundHeight);
            
            // Tercera plataforma (igual de larga que la primera, con hueco antes)
            const thirdStartX = secondStartX + secondWidth + 200; // Hueco de 200px
            createThirdFloorPlatform(this, platforms, thirdStartX, 600, baseWidth, groundHeight);
            
            // Cuarta plataforma (2/3 de la primera, sin borde derecho)
            const fourthWidth = baseWidth * 0.66; // 2/3 de la primera
            const fourthStartX = thirdStartX + baseWidth + 100; // Hueco de 100px
            createFourthFloorPlatform(this, platforms, fourthStartX, 600, fourthWidth, groundHeight);
            
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
            // NIVEL 1 (FÁCIL): Bloques accesibles y bien distribuidos
            
            // Grupo 1: Bloques bajos con champiñón
            for (let i = 0; i < 3; i++) {
                const bObj = new BloqueRompible(this, 200 + i*32, 400, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
                bloquesRompibles.push(bloque);
            }

            const bpObj1 = new BloquePregunta(this, 296, 400, bloqueIdCounter++, 'champinon');
            let bloquePregunta1 = bpObj1.getSprite();
            bloques.add(bloquePregunta1);
            bloquesPregunta.push(bloquePregunta1);
            bloquePregunta1.simbolo = this.add.text(296, 400, '?', {
                fontSize: '20px',
                color: '#8B4513',
                fontStyle: 'bold'
            });
            bloquePregunta1.simbolo.setOrigin(0.5, 0.5);
            
            // Grupo 2: Escalera de bloques
            for (let i = 0; i < 5; i++) {
                const bObj = new Bloque(this, 500 + i*32, 350 - i*30, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
            }
            
            // Grupo 3: Bloques con monedas
            const bpObj2 = new BloquePregunta(this, 900, 320, bloqueIdCounter++, 'moneda');
            let bloquePregunta2 = bpObj2.getSprite();
            bloques.add(bloquePregunta2);
            bloquesPregunta.push(bloquePregunta2);
            bloquePregunta2.simbolo = this.add.text(900, 320, '?', {
                fontSize: '20px',
                color: '#8B4513',
                fontStyle: 'bold'
            });
            bloquePregunta2.simbolo.setOrigin(0.5, 0.5);
            
            for (let i = 0; i < 2; i++) {
                const bObj = new BloqueRompible(this, 932 + i*32, 320, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
                bloquesRompibles.push(bloque);
            }
            
            // Grupo 4: Plataforma alta
            for (let i = 0; i < 4; i++) {
                const bObj = new Bloque(this, 1400 + i*32, 250, bloqueIdCounter++);
                let bloque = bObj.getSprite();
                bloques.add(bloque);
            }
            
            // Grupo 5: Bloques finales
            const bpObj3 = new BloquePregunta(this, 1800, 350, bloqueIdCounter++, 'champinon');
            let bloquePregunta3 = bpObj3.getSprite();
            bloques.add(bloquePregunta3);
            bloquesPregunta.push(bloquePregunta3);
            bloquePregunta3.simbolo = this.add.text(1800, 350, '?', {
                fontSize: '20px',
                color: '#8B4513',
                fontStyle: 'bold'
            });
            bloquePregunta3.simbolo.setOrigin(0.5, 0.5);
            
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
            bloquePregunta1.simbolo = this.add.text(364, 300, '?', {
                fontSize: '20px',
                color: '#8B4513',
                fontStyle: 'bold'
            });
            bloquePregunta1.simbolo.setOrigin(0.5, 0.5);
            
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
            bloquePregunta2.simbolo = this.add.text(1596, 280, '?', {
                fontSize: '20px',
                color: '#8B4513',
                fontStyle: 'bold'
            });
            bloquePregunta2.simbolo.setOrigin(0.5, 0.5);
            
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
            bloquePregunta3.simbolo = this.add.text(2100, 380, '?', {
                fontSize: '20px',
                color: '#8B4513',
                fontStyle: 'bold'
            });
            bloquePregunta3.simbolo.setOrigin(0.5, 0.5);
        }
        
        // === TUBOS VERDES (estilo Mario) ===
        tubos = this.physics.add.staticGroup();
        
        let datosTubos = [];
        if (numero === 1) {
            // NIVEL 1: Tubos más accesibles
            datosTubos = [
                {x: 250, baseH: 80, topY: 470},
                {x: 700, baseH: 120, topY: 430},
                {x: 1100, baseH: 100, topY: 450},
                {x: 1650, baseH: 140, topY: 410},
                {x: 2050, baseH: 80, topY: 470}
            ];
        } else {
            // NIVEL 2: Tubos más altos y peligrosos
            datosTubos = [
                {x: 350, baseH: 160, topY: 390},
                {x: 850, baseH: 140, topY: 410},
                {x: 1250, baseH: 120, topY: 430},
                {x: 1700, baseH: 180, topY: 370},
                {x: 2000, baseH: 160, topY: 390}
            ];
        }
        
        datosTubos.forEach(tubo => {
            let baseY = 568 - tubo.baseH/2;
            let tuboBase = this.add.rectangle(tubo.x, baseY, 50, tubo.baseH, 0x00CC00);
            let tuboTop = this.add.rectangle(tubo.x, tubo.topY, 60, 20, 0x00FF00);
            this.physics.add.existing(tuboBase, true);
            this.physics.add.existing(tuboTop, true);
            tubos.add(tuboBase);
            tubos.add(tuboTop);
        });
        
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
        
        // === ESCALERAS (amarillas) ===
        escaleras = this.physics.add.staticGroup();
        
        let posicionesEscaleras = [];
        if (numero === 1) {
            // NIVEL 1: Escaleras más frecuentes
            posicionesEscaleras = [600, 1150, 1750, 2150];
        } else {
            // NIVEL 2: Menos escaleras
            posicionesEscaleras = [650, 1450, 2050];
        }
        
        posicionesEscaleras.forEach(x => {
            for (let i = 0; i < 4; i++) {
                let escalon = this.add.rectangle(x + i*25, 536 - i*25, 25, 25, 0xDAA520);
                this.physics.add.existing(escalon, true);
                escaleras.add(escalon);
            }
        });
        
        // === MONEDAS (amarillo brillante) ===
        monedas = [];
        let monedaId = 0;
        
        if (numero === 1) {
            // NIVEL 1: Más monedas y más accesibles
            monedas.push(...Moneda.crearLinea(this, 300, 360, 4, 32, monedaId));
            monedaId += 4;
            monedas.push(...Moneda.crearLinea(this, 800, 300, 5, 32, monedaId));
            monedaId += 5;
            monedas.push(...Moneda.crearLinea(this, 1350, 440, 6, 32, monedaId));
            monedaId += 6;
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
                {x: 1400, y: 500}
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
            // Nivel 1 (Fácil): pocos Koopas
            posicionesKoopas = [
                {x: 800, y: 500},
                {x: 1500, y: 500}
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
                {x: 300, y: 450},   // Cerca del inicio
                {x: 900, y: 300},   // Sobre una plataforma media
                {x: 1200, y: 450},
                {x: 1500, y: 450}
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
        let metaX = numero === 1 ? 4300 : 2300; // Nivel 1 termina alrededor de x=4300
        let metaY = 568;
        
        // Mástil de la bandera (gris oscuro, alto)
        mastilBandera = this.add.rectangle(metaX, metaY - 150, 8, 300, 0x666666);
        
        // Bandera roja en la parte superior
        bandera = this.add.polygon(metaX + 25, metaY - 280, [
            0, 0,    // Esquina superior izquierda
            50, 15,  // Punta derecha
            0, 30    // Esquina inferior izquierda
        ], 0xff0000);
        
        // Zona de detección de meta (invisible)
        let zonaMeta = this.add.rectangle(metaX, metaY - 100, 80, 400, 0x00ff00, 0);
        this.physics.add.existing(zonaMeta, true);
        zonaMeta.isMeta = true;

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

        textoMiPuntuacion = this.add.image(180, 28, 'hud_character_0').setScale(0.6);
        textoMiPuntuacion.setScrollFactor(0);
        textoMiPuntuacion.setDepth(100);

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

        textoOtroPuntuacion = this.add.image(180, 70, 'hud_character_0').setScale(0.6);
        textoOtroPuntuacion.setScrollFactor(0);
        textoOtroPuntuacion.setDepth(100);
        
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
            if (datos && datos.puntuacion !== undefined) {
                puntuacionOtro = datos.puntuacion;
                if (textoOtroPuntuacion) {
                    setHudDigit(textoOtroPuntuacion, puntuacionOtro);
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
                jugadorRemoto.actualizarTamaño(datos.grande);
                console.log("Otro jugador actualizado en pantalla - Grande:", datos.grande);
            }
        });
        
        // Recibir cambios de vidas del rival
        ws.socket.on("vidasActualizadas", function(datos) {
            console.log("Vidas del otro jugador actualizadas:", datos.vidas);
            if (textoOtraVidas) {
                setHudDigit(textoOtraVidas, datos.vidas);
            }
        });
        
        // Recibir notificación de que el otro jugador llegó a la meta
        ws.socket.on("jugadorLlegoMeta", function(datos) {
            console.log("Otro jugador llegó a la meta:", datos);
            otroJugadorEnMeta = true;
            if (datos.puntos !== undefined) {
                puntosOtro = datos.puntos;
            }
            // Si ambos han llegado, mostrar victoria
            if (jugadorEnMeta && otroJugadorEnMeta) {
                mostrarVictoria();
            }
        });
        
        console.log("Listeners WebSocket configurados");
    }
    // Función para recoger monedas
    function recogerMoneda(moneda) {
        moneda.recoger(); // Usa el método de la clase Moneda
        puntuacionJugador++;
        setHudDigit(textoMiPuntuacion, puntuacionJugador);
        
        // Sumar 200 puntos por moneda
        puntosJugador += 200;
        console.log("¡Moneda recogida! ID:", moneda.getId(), "Total monedas:", puntuacionJugador, "Puntos:", puntosJugador);
        
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
        let bloqueBaseY = bloque.y + 15; // Parte inferior del bloque (bloque tiene altura 30, mitad = 15)
        
        let distanciaVertical = Math.abs(jugadorCabezaY - bloqueBaseY);
        let distanciaHorizontal = Math.abs(jugador.x - bloque.x);
        
        // Debe estar cerca verticalmente (cabeza tocando base) y alineado horizontalmente
        // Aumentada la tolerancia para mejor detección
        return distanciaVertical < 10 && distanciaHorizontal < (jugador.displayWidth/2 + 20);
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
        
        ws.enviarChampinonRecogido({
            codigo: codigo,
            champinonId: champi.getId()
        });
        
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
        
        // Si el otro jugador ya llegó, mostrar victoria
        if (otroJugadorEnMeta) {
            mostrarVictoria();
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

        // Fondo semi-transparente que cubre toda la pantalla
        let overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        overlay.setScrollFactor(0);
        overlay.setDepth(1000);

        // Panel central del modal
        let modalBg = scene.add.rectangle(400, 300, 450, 280, 0x2c3e50);
        modalBg.setScrollFactor(0);
        modalBg.setDepth(1001);
        modalBg.setStrokeStyle(4, 0xf39c12);

        // Título "¡VICTORIA!"
        let titulo = scene.add.text(400, 200, '¡VICTORIA!', {
            fontSize: '56px',
            fontStyle: 'bold',
            fill: '#f39c12',
            fontFamily: 'Arial'
        });
        titulo.setOrigin(0.5);
        titulo.setScrollFactor(0);
        titulo.setDepth(1002);

        // Mensaje
        let mensaje = scene.add.text(400, 260, 'Ambos jugadores han llegado a la meta', {
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
        
        let textoGanador = scene.add.text(400, 295, ganador, {
            fontSize: '22px',
            fontStyle: 'bold',
            fill: puntosJugador > puntosOtro ? '#2ecc71' : (puntosOtro > puntosJugador ? '#e74c3c' : '#f39c12'),
            fontFamily: 'Arial'
        });
        textoGanador.setOrigin(0.5);
        textoGanador.setScrollFactor(0);
        textoGanador.setDepth(1002);
        
        // Puntuaciones
        let textoPuntosJugador = scene.add.text(400, 330, `Tus puntos: ${puntosJugador}`, {
            fontSize: '18px',
            fill: '#3498db',
            fontFamily: 'Arial'
        });
        textoPuntosJugador.setOrigin(0.5);
        textoPuntosJugador.setScrollFactor(0);
        textoPuntosJugador.setDepth(1002);
        
        let textoPuntosOtro = scene.add.text(400, 355, `Puntos rival: ${puntosOtro}`, {
            fontSize: '18px',
            fill: '#9b59b6',
            fontFamily: 'Arial'
        });
        textoPuntosOtro.setOrigin(0.5);
        textoPuntosOtro.setScrollFactor(0);
        textoPuntosOtro.setDepth(1002);

        // Botón "Aceptar"
        let botonBg = scene.add.rectangle(400, 380, 150, 50, 0x27ae60);
        botonBg.setScrollFactor(0);
        botonBg.setDepth(1002);
        botonBg.setInteractive({ useHandCursor: true });

        let botonTexto = scene.add.text(400, 380, 'ACEPTAR', {
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
            textoGanador.destroy();
            textoPuntosJugador.destroy();
            textoPuntosOtro.destroy();
            botonBg.destroy();
            botonTexto.destroy();
            console.log("Modal de victoria cerrado");
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

        // Mostrar modal de Game Over
        mostrarModalGameOver();
    }

    function mostrarModalGameOver() {
        // Obtener la escena activa
        let scene = game.scene.scenes[0];
        if (!scene) return;

        // Fondo semi-transparente que cubre toda la pantalla
        let overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        overlay.setScrollFactor(0);
        overlay.setDepth(1000);

        // Panel central del modal
        let modalBg = scene.add.rectangle(400, 300, 400, 250, 0x2c3e50);
        modalBg.setScrollFactor(0);
        modalBg.setDepth(1001);
        modalBg.setStrokeStyle(4, 0xe74c3c);

        // Título "GAME OVER"
        let titulo = scene.add.text(400, 220, 'GAME OVER', {
            fontSize: '48px',
            fontStyle: 'bold',
            fill: '#e74c3c',
            fontFamily: 'Arial'
        });
        titulo.setOrigin(0.5);
        titulo.setScrollFactor(0);
        titulo.setDepth(1002);

        // Mensaje
        let mensaje = scene.add.text(400, 280, 'Has perdido todas tus vidas', {
            fontSize: '20px',
            fill: '#ecf0f1',
            fontFamily: 'Arial'
        });
        mensaje.setOrigin(0.5);
        mensaje.setScrollFactor(0);
        mensaje.setDepth(1002);

        // Botón "Aceptar"
        let botonBg = scene.add.rectangle(400, 350, 150, 50, 0x27ae60);
        botonBg.setScrollFactor(0);
        botonBg.setDepth(1002);
        botonBg.setInteractive({ useHandCursor: true });

        let botonTexto = scene.add.text(400, 350, 'ACEPTAR', {
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
            console.log("Modal de Game Over cerrado");
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
                } else if (jugadorPrincipal && typeof jugadorPrincipal.perderVida === 'function') {
                    // Fallback: si no existe el método, quitar todas las vidas manualmente
                    while (jugadorPrincipal.getVidas() > 0) jugadorPrincipal.perderVida();
                    esGameOver = true;
                    if (textoMiVidas) setHudDigit(textoMiVidas, jugadorPrincipal.getVidas());
                } else {
                    // Fallback a variable legacy
                    if (typeof vidasJugador !== 'undefined') {
                        vidasJugador = 0;
                        if (textoMiVidas) setHudDigit(textoMiVidas, vidasJugador);
                        esGameOver = true;
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
            // Limpiar listeners de WebSocket
            ws.socket.off("actualizacionJuego");
            ws.socket.off("actualizacionPuntuacion");
            ws.socket.off("monedaRecogida");
            ws.socket.off("goombaEliminado");
            ws.socket.off("koopaEstadoCambiado");
        }
    };
}
