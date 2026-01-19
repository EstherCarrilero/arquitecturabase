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
        
        // Crear sprite principal del Koopa usando imágenes (snail frames)
        this.sprite = scene.physics.add.sprite(x, y, 'snail_rest');
        this.sprite.setDisplaySize(40, 32);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.3, 0);
        this.sprite.body.setImmovable(false);
        // Cabeza visual ya no necesaria (está en la imagen)
        this.cabeza = null;
        
        // Propiedades de movimiento
        this.direccion = -1; // -1 = izquierda, 1 = derecha
        this.velocidad = 60;
        this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        // Reproducir animación inicial si las animaciones ya existen.
        try {
            const anims = this.scene && this.scene.anims;
            const hasRest = anims && (typeof anims.exists === 'function') && (anims.exists('koopa-rest') || anims.exists('koopa-rest-right'));
            if (hasRest && this.sprite.anims) {
                if (this.direccion > 0 && anims.exists('koopa-rest-right')) this.sprite.play('koopa-rest-right');
                else if (anims.exists('koopa-rest')) this.sprite.play('koopa-rest');
            } else {
                // Si no hay animaciones definidas todavía, usar la textura estática correspondiente
                try {
                    if (this.direccion > 0) this.sprite.setTexture('snail_rest_right');
                    else this.sprite.setTexture('snail_rest');
                } catch (e) {}
            }
        } catch (e) {}
        
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

        // Animaciones: caminar cuando se mueve, descansar cuando parado
        try {
            let vx = this.sprite.body.velocity.x || 0;
            if (Math.abs(vx) > 10) {
                if (this.sprite.anims) {
                    if (vx > 0) this.sprite.play('koopa-walk-right', true);
                    else this.sprite.play('koopa-walk', true);
                }
            } else {
                if (this.sprite.anims) {
                    if (this.direccion > 0) this.sprite.play('koopa-rest-right', true);
                    else this.sprite.play('koopa-rest', true);
                }
            }
        } catch (e) {}
    }
    
    /**
     * Convierte el Koopa en caparazón
     * @returns {Caparazon} El nuevo objeto Caparazon
     */
    convertirACaparazon() {
        // Crear caparazón en la misma posición usando sprite 'snail_shell'
        let caparazon = Caparazon.crearDesdeKoopa(this.scene, this.sprite.x, this.sprite.y, this.id, this);
        // Destruir el sprite del Koopa
        try { if (this.sprite) this.sprite.destroy(); } catch(e){}
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
