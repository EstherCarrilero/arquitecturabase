class Jugador {
    constructor(scene, x, y, color = 0xff0000) {
        this.scene = scene;
        this.grande = false;
        this.vidas = 3;
        this.invulnerable = false;
        this.tiempoInvulnerabilidad = 0;
        this.facing = 'right';
        this.lastHitAt = 0;
        this.blinkInterval = null;
        this.controlsEnabled = true;
        this.muerto = false;
        
        // Crear sprite del jugador usando imagen cargada (frame 0 por defecto)
        // Nota: las imágenes deben haberse cargado previamente en la escena (player_0..player_5)
        this.sprite = scene.physics.add.sprite(x, y, 'player-front');
        // Escalar la imagen original a tamaño de juego pedido (40x48)
        this.sprite.setDisplaySize(40, 48);
        // Permitir caer por debajo del nivel para que los huecos sean mortales
        this.sprite.body.setCollideWorldBounds(false);
        this.sprite.body.setDragX(800);
        this.sprite.body.setMaxVelocity(250, 600);

        // Crear indicador de dirección (mantener como rectángulo simple)
        this.indicador = scene.add.rectangle(x + 16, y, 8, 32, 0xffff00);
        // Asegurar que el indicador no participe en la física a menos que se agregue explicitamente
    }
    
    getSprite() {
        return this.sprite;
    }
    
    getIndicador() {
        return this.indicador;
    }

    morir() {
        // Cancelar cualquier parpadeo en curso
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }

        // Ocultar y desactivar sprite
        if (this.sprite) {
            if (this.sprite.setVisible) this.sprite.setVisible(false); else this.sprite.visible = false;
            if (this.sprite.setActive) this.sprite.setActive(false);
            if (this.sprite.body) {
                try {
                    this.sprite.body.enable = false;
                    if (this.sprite.body.checkCollision) this.sprite.body.checkCollision.none = true;
                    if (typeof this.sprite.body.setSize === 'function') this.sprite.body.setSize(0, 0, false);
                } catch (e) {
                    console.warn('Error al desactivar body en morir():', e);
                }
            }
        }

        // Ocultar indicador
        if (this.indicador) {
            if (this.indicador.setVisible) this.indicador.setVisible(false); else this.indicador.visible = false;
            if (this.indicador.body) this.indicador.body.enable = false;
        }
        // Marcar como muerto para que la lógica deje de procesarlo
        this.muerto = true;
    }

    esMuerto() {
        return !!this.muerto;
    }
    
    revivir() {
        // Reactivar sprite
        if (this.sprite) {
            if (this.sprite.setVisible) this.sprite.setVisible(true); else this.sprite.visible = true;
            if (this.sprite.setActive) this.sprite.setActive(true);
            if (this.sprite.body) {
                try {
                    this.sprite.body.enable = true;
                    if (this.sprite.body.checkCollision) {
                        this.sprite.body.checkCollision.none = false;
                        this.sprite.body.checkCollision.up = true;
                        this.sprite.body.checkCollision.down = true;
                        this.sprite.body.checkCollision.left = true;
                        this.sprite.body.checkCollision.right = true;
                    }
                    // Restaurar tamaño de colisión acorde al tamaño visual
                    let width = 40; // hitbox ancho para sprites 40px
                    let height = this.grande ? 72 : 48; // alto: 48 para pequeño, 72 para grande
                    if (typeof this.sprite.body.setSize === 'function') {
                        this.sprite.body.setSize(width, height, false);
                    }
                } catch (e) {
                    console.warn('Error al reactivar body en revivir():', e);
                }
            }
        }

        // Reactivar indicador
        if (this.indicador) {
            if (this.indicador.setVisible) this.indicador.setVisible(true); else this.indicador.visible = true;
        }
        
        // Desmarcar como muerto
        this.muerto = false;
        
        // Activar invulnerabilidad temporal
        this.activarInvulnerabilidad();
    }

    perderTodasVidas() {
        // Forzar que las vidas lleguen a 0 y ejecutar muerte definitiva
        this.vidas = 0;
        try {
            if (this.blinkInterval) {
                clearInterval(this.blinkInterval);
                this.blinkInterval = null;
            }
        } catch (e) {}

        // Ejecutar morir() para ocultar y desactivar el sprite
        this.morir();

        return true; // Indica Game Over
    }
    
    hacerCrecer() {
        this.grande = true;
        // Mantener ancho visual, aumentar altura para versión "grande"
        this.sprite.setDisplaySize(40, 72);
        this.sprite.y -= 12;
    }

    setControlsEnabled(enabled) {
        this.controlsEnabled = !!enabled;
        if (!this.sprite || !this.sprite.body) return;
        try {
            if (!this.controlsEnabled) {
                // Detener movimiento y desactivar gravedad para permitir animaciones seguras
                this.sprite.body.setVelocity(0, 0);
                this.sprite.body.setAccelerationX(0);
                this.sprite.body.setAllowGravity(false);
            } else {
                this.sprite.body.setAllowGravity(true);
            }
        } catch (e) {
            console.warn('Error al cambiar controles del jugador:', e);
        }
    }
    
    reducirTamaño() {
        this.grande = false;
        this.sprite.setDisplaySize(40, 48);
        this.sprite.y += 12;
    }
    
    perderVida() {
        if (this.grande) {
            // Mostrar frame de golpe al perder el powerup
            try { if (this.sprite && this.sprite.anims) this.sprite.play(this.facing === 'left' ? 'player-hit-left' : 'player-hit'); } catch(e){}
            try { this.lastHitAt = Date.now(); } catch(e) {}
            this.reducirTamaño();
            this.activarInvulnerabilidad();
            // Efecto de parpadeo igual que cuando recibe daño sin powerup
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
                if (this.indicador) this.indicador.visible = !this.indicador.visible;
                parpadeos++;
                if (parpadeos >= 12) {
                    clearInterval(this.blinkInterval);
                    this.blinkInterval = null;
                    if (this.sprite) this.sprite.visible = true;
                    if (this.indicador) this.indicador.visible = true;
                }
            }, 166);

            return false; // No pierde vida, solo se reduce
        }
        
        this.vidas--;
        this.activarInvulnerabilidad();
        
        // Reproducir frame de golpe (usar variante left si corresponde)
        try { if (this.sprite && this.sprite.anims) this.sprite.play(this.facing === 'left' ? 'player-hit-left' : 'player-hit'); } catch(e){}
        try { this.lastHitAt = Date.now(); } catch(e) {}
        // Efecto visual de parpadeo
        let parpadeos = 0;
        this.blinkInterval = setInterval(() => {
            if (!this.sprite) return;
            this.sprite.visible = !this.sprite.visible;
            if (this.indicador) this.indicador.visible = !this.indicador.visible;
            parpadeos++;
            if (parpadeos >= 12) {
                clearInterval(this.blinkInterval);
                this.blinkInterval = null;
                if (this.sprite) this.sprite.visible = true;
                if (this.indicador) this.indicador.visible = true;
            }
        }, 166);
        
        // Empujar hacia atrás
        this.sprite.body.setVelocity(-150, -300);
        
        return this.vidas <= 0; // Retorna true si game over
    }
    
    activarInvulnerabilidad() {
        this.invulnerable = true;
        this.tiempoInvulnerabilidad = Date.now();
        
        // Desactivar invulnerabilidad después de 2 segundos
        setTimeout(() => {
            this.invulnerable = false;
        }, 2000);
    }
    
    esInvulnerable() {
        return this.invulnerable;
    }
    
    esGrande() {
        return this.grande;
    }
    
    getVidas() {
        return this.vidas;
    }
    
    mover(cursors, jumpPressed, reboteEnemigo) {
        if (!this.controlsEnabled) {
            // Mantener indicador alineado verticalmente incluso si controles deshabilitados
            this.indicador.y = this.sprite.y;
            return { jumpPressed, reboteEnemigo };
        }
        // Movimiento horizontal
        if (cursors.left.isDown) {
            this.sprite.body.setAccelerationX(-600);
            this.facing = 'left';
            this.indicador.x = this.sprite.x - 20;
        } else if (cursors.right.isDown) {
            this.sprite.body.setAccelerationX(600);
            this.facing = 'right';
            this.indicador.x = this.sprite.x + 20;
        } else {
            this.sprite.body.setAccelerationX(0);
        }
        
        // Mantener indicador alineado verticalmente
        this.indicador.y = this.sprite.y;
        
        // Animaciones básicas: caminar vs idle cuando está en el suelo
        try {
            let velX = this.sprite.body.velocity.x || 0;
            let enSuelo = (this.sprite.body.blocked && this.sprite.body.blocked.down) || (this.sprite.body.touching && this.sprite.body.touching.down);
            // Priorizar animación de golpe durante un breve periodo
            const HIT_DURATION = 400; // ms
            if (this.lastHitAt && (Date.now() - this.lastHitAt) < HIT_DURATION) {
                const hitKey = this.facing === 'left' ? 'player-hit-left' : 'player-hit';
                if (this.sprite.anims) this.sprite.play(hitKey, true);
            } else {
                // Seleccionar animación según dirección
                let walkKey = this.facing === 'left' ? 'player-walk-left' : 'player-walk';
                let idleKey = this.facing === 'left' ? 'player-idle-left' : 'player-idle';
                if (enSuelo && Math.abs(velX) > 10) {
                    if (this.sprite.anims) this.sprite.play(walkKey, true);
                } else {
                    if (this.sprite.anims) this.sprite.play(idleKey, true);
                }
            }
        } catch (e) {
            // si no existe body o anims, ignorar
        }

        return { jumpPressed, reboteEnemigo };
    }
    
    saltar(cursors, jumpPressed, reboteEnemigo) {
        if (!this.controlsEnabled) return { jumpPressed, reboteEnemigo };
        let nuevoJumpPressed = jumpPressed;
        let nuevoReboteEnemigo = reboteEnemigo;
        
        if (cursors.up.isDown) {
            // Salto inicial cuando está en el suelo
            if (this.sprite.body.touching.down && !jumpPressed) {
                this.sprite.body.setVelocityY(-400);
                nuevoJumpPressed = true;
                try { if (this.sprite && this.sprite.anims) this.sprite.play(this.facing === 'left' ? 'player-jump-left' : 'player-jump'); } catch(e){}
            }
            // Salto variable: mantener presionado = salto más alto
            else if (jumpPressed && this.sprite.body.velocity.y < 0) {
                this.sprite.body.setVelocityY(this.sprite.body.velocity.y - 8);
            }
        } else {
            nuevoJumpPressed = false;
            // Cortar el salto si se suelta la tecla
            if (this.sprite.body.velocity.y < -100 && !reboteEnemigo) {
                this.sprite.body.setVelocityY(-100);
            }
            // Resetear flag de rebote
            if (reboteEnemigo && this.sprite.body.velocity.y >= 0) {
                nuevoReboteEnemigo = false;
            }
        }
        
        return { jumpPressed: nuevoJumpPressed, reboteEnemigo: nuevoReboteEnemigo };
    }
    
    getPosicion() {
        return {
            x: Math.round(this.sprite.x),
            y: Math.round(this.sprite.y)
        };
    }
    
    getFacing() {
        return this.facing;
    }
}
