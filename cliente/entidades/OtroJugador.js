class OtroJugador {
    constructor(scene, x, y, color = 0x0000ff) {
        this.scene = scene;
        this.facing = 'right';
        this.lastHitAt = 0;
        this.blinkInterval = null;
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
        try { if (this.sprite.anims) this.sprite.play(this.facing === 'left' ? 'player-pink-idle-left' : 'player-pink-idle', true); } catch(e){}
    }

    recibirGolpe() {
        if (this.muerto) return;
        try {
            if (this.sprite && this.sprite.anims) {
                const key = this.facing === 'left' ? 'player-pink-hit-left' : 'player-pink-hit';
                this.sprite.play(key);
                this.lastHitAt = Date.now();
                // Activar parpadeo visual al recibir daño
                try { this.activarParpadeo(); } catch(e) {}
            }
        } catch (e) {
            console.warn('Error en recibirGolpe de OtroJugador:', e);
        }
    }

    activarParpadeo() {
        // No iniciar parpadeo si el jugador ya está marcado como muerto
        if (this.muerto) return;
        try {
            if (this.blinkInterval) {
                clearInterval(this.blinkInterval);
                this.blinkInterval = null;
            }
        } catch (e) {}
        let parpadeos = 0;
        this.blinkInterval = setInterval(() => {
            if (!this.sprite) return;
            this.sprite.visible = !this.sprite.visible;
            parpadeos++;
            if (parpadeos >= 12) {
                try { clearInterval(this.blinkInterval); } catch(e) {}
                this.blinkInterval = null;
                if (this.sprite) this.sprite.visible = true;
            }
        }, 166);
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
            // Si hay un parpadeo en curso, pararlo para evitar que vuelva a mostrarse
            try {
                if (this.blinkInterval) {
                    clearInterval(this.blinkInterval);
                    this.blinkInterval = null;
                }
            } catch (e) {}
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
                if (this.sprite.anims) this.sprite.play(this.facing === 'left' ? 'player-pink-idle-left' : 'player-pink-idle');
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
        // Determinar dirección basada en la nueva posición relativa a la anterior
        try {
            if (typeof this.ultimaPosicion.x === 'number') {
                this.facing = (this.target.x < this.ultimaPosicion.x) ? 'left' : 'right';
            }
        } catch (e) {}
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
                    // Priorizar animación de golpe durante un breve periodo
                    const HIT_DURATION = 400;
                    if (this.lastHitAt && (Date.now() - this.lastHitAt) < HIT_DURATION) {
                        const hitKey = this.facing === 'left' ? 'player-pink-hit-left' : 'player-pink-hit';
                        if (this.sprite.anims) this.sprite.play(hitKey, true);
                        return;
                    }
                // Si hay movimiento vertical pronunciado hacia arriba, reproducir salto
                    let jumpKey = this.facing === 'left' ? 'player-pink-jump-left' : 'player-pink-jump';
                    let walkKey = this.facing === 'left' ? 'player-pink-walk-left' : 'player-pink-walk';
                    let idleKey = this.facing === 'left' ? 'player-pink-idle-left' : 'player-pink-idle';
                    if (Math.abs(distY) > 6 && this.target.y < this.sprite.y) {
                        if (this.sprite.anims) this.sprite.play(jumpKey, true);
                    } else if (Math.abs(distX) > 1) {
                        if (this.sprite.anims) this.sprite.play(walkKey, true);
                    } else {
                        if (this.sprite.anims) this.sprite.play(idleKey, true);
                    }
            } catch (e) {}
        } else {
            // Snappear si está muy cerca
            this.sprite.x = this.target.x;
            this.sprite.y = this.target.y;
            try { if (this.sprite.anims) this.sprite.play(this.facing === 'left' ? 'player-pink-idle-left' : 'player-pink-idle', true); } catch(e){}
        }
    }
}
