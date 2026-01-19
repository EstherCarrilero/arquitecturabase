class Tuberia {
    constructor(scene, x, altura) {
        this.scene = scene;
        this.x = x;
        this.altura = altura; // Altura total de la tubería en píxeles
        this.sprites = []; // Array de todos los sprites que componen la tubería
        this.waterSprites = []; // Sprites de agua (el jugador puede atravesarlos)
        
        // Tamaño de cada tile (usar tamaño estándar de bloque / bloque pregunta = 30x30)
        this.tileSize = 30;
        // Factor adicional de escala para hacer los sprites un poco más grandes
        this.scale = 1.25; // ajustar este valor para aumentar/reducir tamaño (1.0 = tileSize)
        // Tamaño visual efectivo usado para spacing (evita solapamientos cuando se escala)
        this.visualTile = this.tileSize * this.scale;
        
        // Calcular cuántas filas necesitamos de la parte sólida (debajo del agua)
        // Queremos mantener la `altura` original: número de filas sólidas = ceil(altura / tileSize)
        const filasSolidas = Math.max(1, Math.ceil(this.altura / this.tileSize));
        // Total de filas = 1 fila de agua superior + filas sólidas (asegurar mínimo 3 filas)
        this.filas = Math.max(3, 1 + filasSolidas);
        
        // Ancho fijo de la tubería (3 tiles: izquierda, centro, derecha)
        this.ancho = 3;
        
        this.crearTuberia();
    }
    
    crearTuberia() {
        // La Y base es donde termina la tubería (parte inferior) — usar el alto de la escena
        const gameHeight = (this.scene.scale && this.scene.scale.height) ? this.scene.scale.height :
            (this.scene.sys && this.scene.sys.game && this.scene.sys.game.config && this.scene.sys.game.config.height ? this.scene.sys.game.config.height : 568);
        const yBase = gameHeight;
        // Ajustar inicio para que la fila inferior quede alineada con el borde inferior de la pantalla
        const yInicio = yBase - (this.filas * this.visualTile) + (this.visualTile / 2);
        
        // Crear la tubería fila por fila, de arriba hacia abajo
        for (let fila = 0; fila < this.filas; fila++) {
            const y = yInicio + (fila * this.visualTile);
            
            if (fila === 0) {
                // FILA SUPERIOR: vertical_top (esquinas) + water_top (centro)
                // Esquina izquierda
                const verticalTopLeft = this.scene.add.image(
                    this.x - this.visualTile, 
                    y, 
                    'terrain_grass_vertical_top'
                ).setOrigin(0.5, 0.5).setDepth(300);
                verticalTopLeft.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.sprites.push(verticalTopLeft);
                
                // Centro con agua
                const waterTop = this.scene.add.image(
                    this.x, 
                    y, 
                    'water_top'
                ).setOrigin(0.5, 0.5).setDepth(300);
                waterTop.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.sprites.push(waterTop);
                this.waterSprites.push(waterTop); // El jugador puede atravesar el agua
                
                // Esquina derecha
                const verticalTopRight = this.scene.add.image(
                    this.x + this.visualTile, 
                    y, 
                    'terrain_grass_vertical_top'
                ).setOrigin(0.5, 0.5).setDepth(300);
                verticalTopRight.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.sprites.push(verticalTopRight);
                
            } else if (fila === 1) {
                // SEGUNDA FILA: ground_left + ground_top (debajo del agua) + ground_right
                const blockLeft = this.scene.add.image(
                    this.x - this.visualTile, 
                    y, 
                    'ground_left'
                ).setOrigin(0.5, 0.5).setDepth(300);
                blockLeft.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.scene.physics.add.existing(blockLeft, true);
                this.sprites.push(blockLeft);
                
                const blockTop = this.scene.add.image(
                    this.x, 
                    y, 
                    'ground_top'
                ).setOrigin(0.5, 0.5).setDepth(300);
                blockTop.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.scene.physics.add.existing(blockTop, true);
                this.sprites.push(blockTop);
                
                const blockRight = this.scene.add.image(
                    this.x + this.visualTile, 
                    y, 
                    'ground_right'
                ).setOrigin(0.5, 0.5).setDepth(300);
                blockRight.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.scene.physics.add.existing(blockRight, true);
                this.sprites.push(blockRight);
                
            } else {
                // FILAS RESTANTES: ground_left + ground_center + ground_right
                const blockLeft = this.scene.add.image(
                    this.x - this.visualTile, 
                    y, 
                    'ground_left'
                ).setOrigin(0.5, 0.5).setDepth(300);
                blockLeft.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.scene.physics.add.existing(blockLeft, true);
                this.sprites.push(blockLeft);
                
                const blockCenter = this.scene.add.image(
                    this.x, 
                    y, 
                    'ground_center'
                ).setOrigin(0.5, 0.5).setDepth(300);
                blockCenter.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.scene.physics.add.existing(blockCenter, true);
                this.sprites.push(blockCenter);
                
                const blockRight = this.scene.add.image(
                    this.x + this.visualTile, 
                    y, 
                    'ground_right'
                ).setOrigin(0.5, 0.5).setDepth(300);
                blockRight.setDisplaySize(this.tileSize * this.scale, this.tileSize * this.scale);
                this.scene.physics.add.existing(blockRight, true);
                this.sprites.push(blockRight);
            }
        }
    }
    
    // Obtener todos los sprites sólidos (excluyendo el agua)
    getSpritesColision() {
        return this.sprites.filter(s => !this.waterSprites.includes(s));
    }
    
    // Obtener todos los sprites (incluido el agua)
    getTodosSprites() {
        return this.sprites;
    }
    
    // Obtener la posición Y del agua (para colocar plantas piraña)
    getWaterTopY() {
        if (this.waterSprites.length > 0) {
            return this.waterSprites[0].y;
        }
        return null;
    }
    
    // Destruir la tubería
    destroy() {
        this.sprites.forEach(sprite => {
            try {
                if (sprite) sprite.destroy();
            } catch (e) {}
        });
        this.sprites = [];
        this.waterSprites = [];
    }
}
