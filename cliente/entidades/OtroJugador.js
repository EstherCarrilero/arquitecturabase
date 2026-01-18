class OtroJugador {
    constructor(scene, x, y, color = 0x0000ff) {
        this.scene = scene;
        this.grande = false;
        this.muerto = false;
        this.target = { x: x, y: y };
        this.ultimaPosicion = { x: x, y: y };
        this.ultimaPosicionRecibida = 0;
        
        // Crear sprite del otro jugador usando las imágenes rosa (deben cargarse en la escena)
        this.sprite = scene.physics.add.sprite(x, y, 'player-pink-front');
        this.sprite.setDisplaySize(40, 48);
        // Para el jugador remoto no aplicamos gravedad ni interacción física directa
        this.sprite.body.setCollideWorldBounds(false);
        this.sprite.body.setAllowGravity(false);
        this.sprite.body.setImmovable(true);
        this.sprite.body.setVelocity(0, 0);
        this.sprite.visible = false;
    }
    
    getSprite() {
        return this.sprite;
    }
    
    mostrar() {
        if (this.muerto) return;
        this.sprite.visible = true;
        try { if (this.sprite.anims) this.sprite.play('player-pink-idle', true); } catch(e){}
    }
    
    ocultar() {
        this.sprite.visible = false;
    }
    
    esVisible() {
        return this.sprite.visible;
    }

    esMuerto() {
        return !!this.muerto;
    }

    morir() {
        try {
            this.muerto = true;
            // Ocultar sprite y desactivar body
            if (this.sprite) {
                this.sprite.visible = false;
                if (this.sprite.body) {
                    try {
                        this.sprite.body.enable = false;
                        if (this.sprite.body.checkCollision) this.sprite.body.checkCollision.none = true;
                        if (typeof this.sprite.body.setSize === 'function') this.sprite.body.setSize(0, 0, false);
                    } catch (e) {
                        console.warn('Error al desactivar body de OtroJugador:', e);
                    }
                }
            }
        } catch (e) {
            console.warn('Error en morir() de OtroJugador:', e);
        }
    }

    revivir() {
        this.muerto = false;
        if (this.sprite) {
            try {
                if (this.sprite.setVisible) this.sprite.setVisible(true); else this.sprite.visible = true;
                if (this.sprite.body) {
                    this.sprite.body.enable = true;
                    if (this.sprite.body.checkCollision) this.sprite.body.checkCollision.none = false;
                    if (typeof this.sprite.body.setSize === 'function') {
                        let width = 40;
                        let height = this.grande ? 72 : 48;
                        this.sprite.body.setSize(width, height, false);
                    }
                }
                if (this.sprite.anims) this.sprite.play('player-pink-idle');
            } catch (e) {
                console.warn('Error al revivir OtroJugador:', e);
            }
        }
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
            this.sprite.setDisplaySize(40, 72);
            this.sprite.y -= 12;
            this.target.y -= 12;
        } else {
            this.sprite.setDisplaySize(40, 48);
            this.sprite.y += 12;
            this.target.y += 12;
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
            // Elegir animación según movimiento
            try {
                // Si hay movimiento vertical pronunciado hacia arriba, reproducir salto
                if (Math.abs(distY) > 6 && this.target.y < this.sprite.y) {
                    if (this.sprite.anims) this.sprite.play('player-pink-jump', true);
                } else if (Math.abs(distX) > 1) {
                    if (this.sprite.anims) this.sprite.play('player-pink-walk', true);
                } else {
                    if (this.sprite.anims) this.sprite.play('player-pink-idle', true);
                }
            } catch (e) {}
        } else {
            // Snappear si está muy cerca
            this.sprite.x = this.target.x;
            this.sprite.y = this.target.y;
            try { if (this.sprite.anims) this.sprite.play('player-pink-idle', true); } catch(e){}
        }
    }
}
