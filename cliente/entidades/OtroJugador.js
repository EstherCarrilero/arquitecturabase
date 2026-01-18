class OtroJugador {
    constructor(scene, x, y, color = 0x0000ff) {
        this.scene = scene;
        this.grande = false;
        this.target = { x: x, y: y };
        this.ultimaPosicion = { x: x, y: y };
        this.ultimaPosicionRecibida = 0;
        
        // Crear sprite del otro jugador
        this.sprite = scene.add.rectangle(x, y, 32, 32, color);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setAllowGravity(false);
        this.sprite.body.setImmovable(true);
        this.sprite.body.setVelocity(0, 0);
        this.sprite.visible = false;
    }
    
    getSprite() {
        return this.sprite;
    }
    
    mostrar() {
        this.sprite.visible = true;
    }
    
    ocultar() {
        this.sprite.visible = false;
    }
    
    esVisible() {
        return this.sprite.visible;
    }
    
    actualizarPosicion(x, y) {
        this.ultimaPosicion.x = this.target.x;
        this.ultimaPosicion.y = this.target.y;
        this.ultimaPosicionRecibida = Date.now();
        this.target.x = x;
        this.target.y = y;
    }
    
    actualizarTamaño(grande) {
        this.grande = grande;
        if (grande) {
            this.sprite.displayWidth = 32;
            this.sprite.displayHeight = 48;
            this.sprite.y -= 8;
            this.target.y -= 8;
        } else {
            this.sprite.displayWidth = 32;
            this.sprite.displayHeight = 32;
            this.sprite.y += 8;
            this.target.y += 8;
        }
    }
    
    esGrande() {
        return this.grande;
    }
    
    getTarget() {
        return this.target;
    }
    
    getUltimaPosicion() {
        return this.ultimaPosicion;
    }
    
    getUltimaPosicionRecibida() {
        return this.ultimaPosicionRecibida;
    }
    
    interpolar(time) {
        // Calcular distancia al objetivo
        let distX = this.target.x - this.sprite.x;
        let distY = this.target.y - this.sprite.y;
        let distancia = Math.sqrt(distX * distX + distY * distY);
        
        // Interpolación balanceada para movimiento fluido y fiel (actualizaciones cada 20ms)
        let factorInterpolacion = 0.4;
        
        // Si está muy lejos, teleportar
        if (distancia > 150) {
            this.sprite.x = this.target.x;
            this.sprite.y = this.target.y;
            return;
        }
        
        // Interpolar posición
        if (distancia > 1) {
            this.sprite.x = Phaser.Math.Linear(this.sprite.x, this.target.x, factorInterpolacion);
            this.sprite.y = Phaser.Math.Linear(this.sprite.y, this.target.y, factorInterpolacion);
        } else {
            // Snappear si está muy cerca
            this.sprite.x = this.target.x;
            this.sprite.y = this.target.y;
        }
    }
}
