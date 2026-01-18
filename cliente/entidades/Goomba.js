class Goomba {
    constructor(scene, x, y, id) {
        this.scene = scene;
        this.id = id;
        this.activo = true;
        this.direccion = -1; // -1 izquierda, 1 derecha
        this.velocidad = 50;
        
        // Crear sprite del Goomba (rectángulo marrón)
        this.sprite = scene.add.rectangle(x, y, 28, 28, 0x8B4513);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0, 0);
        this.sprite.body.setImmovable(true); // No se mueve al ser empujado
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
    }
    
    eliminar() {
        if (!this.activo) {
            console.log("Goomba ya estaba inactivo - ID:", this.id);
            return;
        }
        
        this.activo = false;
        
        // Detener movimiento
        this.sprite.body.setVelocity(0, 0);
        
        // Oscurecer y aplastar visualmente
        this.sprite.setFillStyle(0x555555);
        this.sprite.displayHeight = 10;
        
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
