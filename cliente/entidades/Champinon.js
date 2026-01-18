class Champinon {
    constructor(scene, x, y, id) {
        this.scene = scene;
        this.id = id;
        this.activo = true;
        this.direccion = 1; // 1 derecha, -1 izquierda
        this.velocidad = 80;
        
        // Crear sprite del champiñón (rectángulo rojo)
        this.sprite = scene.add.rectangle(x, y, 28, 28, 0xFF0000);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0, 0);
        this.sprite.body.setVelocityX(this.velocidad);
        
        // Puntos blancos decorativos del champiñón
        this.punto1 = scene.add.circle(x - 7, y - 7, 4, 0xFFFFFF);
        this.punto2 = scene.add.circle(x + 7, y - 7, 4, 0xFFFFFF);
        this.punto3 = scene.add.circle(x, y - 3, 3, 0xFFFFFF);
        
        // Guardar referencia a la clase en el sprite para acceder desde colisiones
        this.sprite.champRef = this;
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
        if (!this.activo) {
            // Ocultar champiñón consumido
            this.sprite.visible = false;
            if (this.punto1) this.punto1.visible = false;
            if (this.punto2) this.punto2.visible = false;
            if (this.punto3) this.punto3.visible = false;
            return;
        }
        
        // Cambiar dirección al chocar con bloques o bordes
        if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
            this.direccion *= -1;
            this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        }
        
        // Mantener velocidad constante
        if (Math.abs(this.sprite.body.velocity.x) < 75) {
            this.sprite.body.setVelocityX(this.direccion * this.velocidad);
        }
        
        // Actualizar posición de los puntos decorativos
        if (this.punto1) {
            this.punto1.x = this.sprite.x - 7;
            this.punto1.y = this.sprite.y - 7;
        }
        if (this.punto2) {
            this.punto2.x = this.sprite.x + 7;
            this.punto2.y = this.sprite.y - 7;
        }
        if (this.punto3) {
            this.punto3.x = this.sprite.x;
            this.punto3.y = this.sprite.y - 3;
        }
    }
    
    recoger() {
        this.activo = false;
        this.sprite.visible = false;
        if (this.punto1) this.punto1.visible = false;
        if (this.punto2) this.punto2.visible = false;
        if (this.punto3) this.punto3.visible = false;
        console.log("Champiñón recogido (ID:", this.id, ")");
    }
    
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.punto1) this.punto1.destroy();
        if (this.punto2) this.punto2.destroy();
        if (this.punto3) this.punto3.destroy();
    }
    
    // Método estático para crear múltiples champiñones
    static crearChampinones(scene, posiciones) {
        const champinones = [];
        
        posiciones.forEach((pos, index) => {
            const champinon = new Champinon(scene, pos.x, pos.y, index);
            champinones.push(champinon);
        });
        
        return champinones;
    }
    
    // Método estático para crear un champiñón desde un bloque
    static crearDesdeBloque(scene, x, y, idInicial) {
        const champinon = new Champinon(scene, x, y, idInicial);
        champinon.sprite.body.setVelocityY(-150);
        champinon.sprite.body.setVelocityX(80);
        return champinon;
    }
}
