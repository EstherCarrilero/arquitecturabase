class Goomba {
    constructor(scene, x, y, id) {
        this.scene = scene;
        this.id = id;
        this.activo = true;
        this.direccion = -1; // -1 izquierda, 1 derecha
        this.velocidad = 50;
        
        // Crear sprite del Goomba usando imágenes slime
        this.sprite = scene.physics.add.sprite(x, y, 'slime-rest');
        this.sprite.setDisplaySize(44, 34);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0, 0);
        this.sprite.body.setImmovable(true);
        this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        
        // Guardar referencia a la clase en el sprite para acceder desde colisiones
        this.sprite.goombaRef = this;
    }
    
    getSprite() {
        return this.sprite;
    }
    
    getId() {
        return this.id;
    }
    
    isActivo() {
        return this.activo;
    }
    
    actualizar() {
        if (!this.activo) return;
        
        // Cambiar dirección al chocar con bloques o bordes
        if (this.sprite.body.blocked.left || this.sprite.body.blocked.right ||
            this.sprite.body.touching.left || this.sprite.body.touching.right) {
            this.direccion *= -1; // Cambiar dirección
            this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        }

        // Mantener velocidad constante
        if (Math.abs(this.sprite.body.velocity.x) < 45) {
            this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        }

        // Animaciones: caminar cuando se mueve, descansar cuando esté parado
        try {
            let vx = this.sprite.body.velocity.x || 0;
            // Seleccionar animación según dirección (derecha = variantes '_right')
            if (Math.abs(vx) > 10) {
                if (this.sprite.anims) {
                    if (vx > 0) this.sprite.play('goomba-walk-right', true);
                    else this.sprite.play('goomba-walk', true);
                }
            } else {
                if (this.sprite.anims) {
                    if (this.direccion > 0) this.sprite.play('goomba-rest-right', true);
                    else this.sprite.play('goomba-rest', true);
                }
            }
        } catch (e) {}
    }
    
    eliminar() {
        if (!this.activo) {
            console.log("Goomba ya estaba inactivo - ID:", this.id);
            return;
        }
        
        this.activo = false;
        
        // Detener movimiento
        this.sprite.body.setVelocity(0, 0);
        // Cambiar textura a 'flat' cuando es pisado
        try {
            if (this.sprite.setTexture) {
                if (this.direccion > 0) this.sprite.setTexture('slime-flat-right');
                else this.sprite.setTexture('slime-flat');
            }
            this.sprite.setDisplaySize(46, 14);
        } catch (e) {}

        // Eliminar después de animación
        setTimeout(() => {
            if (this.sprite && this.sprite.active) {
                this.sprite.destroy();
            }
        }, 500);
        
        console.log("Goomba eliminado - ID:", this.id);
    }
    
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
    
    // Método estático para crear múltiples Goombas
    static crearGoombas(scene, posiciones) {
        const goombas = [];
        let idCounter = 0;
        
        posiciones.forEach(pos => {
            const goomba = new Goomba(scene, pos.x, pos.y, idCounter++);
            goombas.push(goomba);
        });
        
        return goombas;
    }
}
