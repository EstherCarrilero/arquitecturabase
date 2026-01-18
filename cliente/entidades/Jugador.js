class Jugador {
    constructor(scene, x, y, color = 0xff0000) {
        this.scene = scene;
        this.grande = false;
        this.vidas = 3;
        this.invulnerable = false;
        this.tiempoInvulnerabilidad = 0;
        this.facing = 'right';
        
        // Crear sprite del jugador
        this.sprite = scene.add.rectangle(x, y, 32, 32, color);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setDragX(800);
        this.sprite.body.setMaxVelocity(250, 600);
        
        // Crear indicador de dirección
        this.indicador = scene.add.rectangle(x + 16, y, 8, 32, 0xffff00);
    }
    
    getSprite() {
        return this.sprite;
    }
    
    getIndicador() {
        return this.indicador;
    }
    
    hacerCrecer() {
        this.grande = true;
        this.sprite.displayWidth = 32;
        this.sprite.displayHeight = 48;
        this.sprite.y -= 8;
    }
    
    reducirTamaño() {
        this.grande = false;
        this.sprite.displayWidth = 32;
        this.sprite.displayHeight = 32;
        this.sprite.y += 8;
    }
    
    perderVida() {
        if (this.grande) {
            this.reducirTamaño();
            this.activarInvulnerabilidad();
            return false; // No pierde vida, solo se reduce
        }
        
        this.vidas--;
        this.activarInvulnerabilidad();
        
        // Efecto visual de parpadeo
        let parpadeos = 0;
        let intervaloParpadeo = setInterval(() => {
            this.sprite.visible = !this.sprite.visible;
            this.indicador.visible = !this.indicador.visible;
            parpadeos++;
            if (parpadeos >= 12) {
                clearInterval(intervaloParpadeo);
                this.sprite.visible = true;
                this.indicador.visible = true;
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
        
        return { jumpPressed, reboteEnemigo };
    }
    
    saltar(cursors, jumpPressed, reboteEnemigo) {
        let nuevoJumpPressed = jumpPressed;
        let nuevoReboteEnemigo = reboteEnemigo;
        
        if (cursors.up.isDown) {
            // Salto inicial cuando está en el suelo
            if (this.sprite.body.touching.down && !jumpPressed) {
                this.sprite.body.setVelocityY(-400);
                nuevoJumpPressed = true;
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
