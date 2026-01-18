/**
 * Clase Caparazon - Representa el caparazón de una tortuga Koopa
 * 
 * Estados:
 * - Quieto (velocidad = 0): No se mueve, puede ser empujado sin hacer daño
 * - En movimiento (velocidad != 0): Se desliza rápidamente y hace daño
 * 
 * Interacciones:
 * - Golpe desde arriba cuando está quieto → Se lanza en dirección opuesta al jugador
 * - Golpe desde arriba cuando está en movimiento → Se detiene
 * - Colisión lateral cuando está en movimiento → Hace daño
 * - Colisión lateral cuando está quieto → Se empuja sin hacer daño
 */
class Caparazon {
    constructor(scene, x, y, id, spriteExistente = null) {
        this.scene = scene;
        this.id = id;
        // Siempre crear un sprite nuevo para el caparazón usando la textura 'snail_shell'
        // Si hay un sprite existente (Koopa), destrúyelo y crear uno nuevo en la misma posición
        try { if (spriteExistente && spriteExistente.sprite) spriteExistente = spriteExistente.sprite; } catch(e){}
        if (spriteExistente && spriteExistente.destroy) {
            try { spriteExistente.destroy(); } catch(e){}
        }
        this.sprite = scene.physics.add.sprite(x, y, 'snail_shell');
        this.sprite.setDisplaySize(34, 24);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.3, 0);
        this.sprite.body.setImmovable(false);
        
        // Propiedades de movimiento
        this.velocidad = 0; // 0 = quieto, ±400 = en movimiento
        this.sprite.body.setVelocityX(this.velocidad);
        
        // No usar immovable ya que impide que el caparazón responda a gravedad
        // La colisión con el jugador se maneja manualmente en golpearKoopa
        this.sprite.body.setImmovable(false);
        
        // Estado
        this.activo = true;
        this.cooldownColision = 0;
        this.cooldownRebote = 0;
        
        // Referencia circular para callbacks de colisión
        this.sprite.caparazonRef = this;
        
        // Si el sprite venía de un Koopa, limpiar la referencia anterior
        if (spriteExistente && spriteExistente.koopaRef) {
            spriteExistente.koopaRef = null;
        }
        
        // Mantener referencia al estado para compatibilidad
        this.sprite.estado = 'caparazon';
        this.sprite.velocidadCaparazon = this.velocidad;
    }
    
    /**
     * Obtiene el sprite del caparazón
     */
    getSprite() {
        return this.sprite;
    }
    
    /**
     * Obtiene el ID del caparazón
     */
    getId() {
        return this.id;
    }
    
    /**
     * Verifica si el caparazón está activo
     */
    isActivo() {
        return this.activo;
    }
    
    /**
     * Obtiene la velocidad actual del caparazón
     */
    getVelocidad() {
        return this.velocidad;
    }
    
    /**
     * Verifica si el caparazón está en movimiento
     */
    estaEnMovimiento() {
        return Math.abs(this.velocidad) > 50;
    }
    
    /**
     * Detiene el caparazón
     */
    detener() {
        this.velocidad = 0;
        this.sprite.body.setVelocityX(0);
        this.sprite.velocidadCaparazon = 0;
    }
    
    /**
     * Lanza el caparazón en una dirección
     * @param {number} direccion - -1 para izquierda, 1 para derecha
     */
    lanzar(direccion) {
        this.velocidad = direccion * 400;
        this.sprite.body.setVelocityX(this.velocidad);
        this.sprite.velocidadCaparazon = this.velocidad;
    }
    
    /**
     * Empuja el caparazón (similar a lanzar pero desde colisión lateral)
     * @param {number} direccion - -1 para izquierda, 1 para derecha
     */
    empujar(direccion) {
        this.lanzar(direccion);
    }
    
    /**
     * Establece la velocidad del caparazón directamente
     * @param {number} velocidad - La velocidad a establecer
     */
    setVelocidad(velocidad) {
        this.velocidad = velocidad;
        this.sprite.body.setVelocityX(velocidad);
        this.sprite.velocidadCaparazon = velocidad;
    }
    
    /**
     * Actualiza el movimiento del caparazón
     */
    actualizar(deltaTime = 16) {
        // Decrementar cooldowns
        if (this.cooldownColision > 0) {
            this.cooldownColision -= deltaTime;
        }
        if (this.cooldownRebote > 0) {
            this.cooldownRebote -= deltaTime;
        }
        
        if (!this.activo) return;
        
        if (this.velocidad !== 0) {
            // Caparazón en movimiento - velocidad constante sin fricción
            this.sprite.body.setVelocityX(this.velocidad);
            
            // Rebotar en bordes
            if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
                this.velocidad *= -1;
                this.sprite.body.setVelocityX(this.velocidad);
                this.sprite.velocidadCaparazon = this.velocidad;
            }
        } else {
            // Caparazón quieto
            this.sprite.body.setVelocityX(0);
        }
    }
    
    /**
     * Invierte la dirección del caparazón (usado en colisiones)
     */
    invertirDireccion() {
        this.velocidad *= -1;
        this.sprite.body.setVelocityX(this.velocidad);
        this.sprite.velocidadCaparazon = this.velocidad;
    }
    
    /**
     * Destruye el caparazón completamente
     */
    destruir() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        this.activo = false;
    }
    
    /**
     * Método estático para crear un caparazón desde un Koopa golpeado
     * @param {Phaser.Scene} scene - La escena del juego
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} id - ID del caparazón
     * @param {Phaser.GameObjects.Rectangle} sprite - Sprite existente del Koopa
     * @returns {Caparazon} El nuevo objeto Caparazon
     */
    static crearDesdeKoopa(scene, x, y, id, sprite) {
        return new Caparazon(scene, x, y, id, sprite);
    }
}
