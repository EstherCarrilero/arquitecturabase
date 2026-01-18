/**
 * Clase Koopa - Representa una tortuga enemiga en estado caminando
 * 
 * Estados:
 * - "caminando": Koopa normal que camina de lado a lado
 * 
 * Cuando es golpeado desde arriba, se convierte en Caparazon
 */
class Koopa {
    constructor(scene, x, y, id) {
        this.scene = scene;
        this.id = id;
        
        // Crear sprite principal del Koopa (verde)
        this.sprite = scene.add.rectangle(x, y, 32, 40, 0x00AA00);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.3, 0);
            this.sprite.body.setImmovable(true);
        
        // Crear cabeza amarilla (característica visual del Koopa)
        this.cabeza = scene.add.circle(x, y - 15, 8, 0xFFFF00);
        
        // Propiedades de movimiento
        this.direccion = -1; // -1 = izquierda, 1 = derecha
        this.velocidad = 60;
        this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        
        // Estado
        this.activo = true;
        this.cooldownColision = 0;
        
        // Referencia circular para callbacks de colisión
        this.sprite.koopaRef = this;
    }
    
    /**
     * Obtiene el sprite del Koopa
     */
    getSprite() {
        return this.sprite;
    }
    
    /**
     * Obtiene el ID del Koopa
     */
    getId() {
        return this.id;
    }
    
    /**
     * Verifica si el Koopa está activo
     */
    isActivo() {
        return this.activo;
    }
    
    /**
     * Actualiza el movimiento del Koopa caminando
     */
    actualizar(deltaTime = 16) {
        // Decrementar cooldown de colisión
        if (this.cooldownColision > 0) {
            this.cooldownColision -= deltaTime;
        }
        
        if (!this.activo) return;
        
        // Detectar colisión con bloques, paredes u otros enemigos
        if (this.sprite.body.blocked.left || this.sprite.body.blocked.right ||
            this.sprite.body.touching.left || this.sprite.body.touching.right) {
            this.direccion *= -1;
            this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        }
        
        // Mantener velocidad constante
        if (Math.abs(this.sprite.body.velocity.x) < 55) {
            this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        }
        
        // Actualizar posición de la cabeza
        if (this.cabeza) {
            this.cabeza.x = this.sprite.x;
            this.cabeza.y = this.sprite.y - 15;
            this.cabeza.visible = true;
        }
    }
    
    /**
     * Convierte el Koopa en caparazón
     * @returns {Caparazon} El nuevo objeto Caparazon
     */
    convertirACaparazon() {
        // Ocultar cabeza
        if (this.cabeza) {
            this.cabeza.visible = false;
            this.cabeza.destroy();
        }
        
        // Crear caparazón en la misma posición
        let caparazon = new Caparazon(
            this.scene,
            this.sprite.x,
            this.sprite.y,
            this.id,
            this.sprite
        );
        
        // El sprite ahora pertenece al caparazón
        this.activo = false;
        
        return caparazon;
    }
    
    /**
     * Destruye el Koopa completamente
     */
    destruir() {
        if (this.cabeza) {
            this.cabeza.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
        this.activo = false;
    }
    
    /**
     * Método estático para crear múltiples Koopas
     * @param {Phaser.Scene} scene - La escena del juego
     * @param {Array} posiciones - Array de {x, y} con las posiciones
     * @returns {Array} Array de objetos Koopa
     */
    static crearKoopas(scene, posiciones) {
        let koopas = [];
        posiciones.forEach((pos, index) => {
            let koopa = new Koopa(scene, pos.x, pos.y, index);
            koopas.push(koopa);
        });
        return koopas;
    }
}
