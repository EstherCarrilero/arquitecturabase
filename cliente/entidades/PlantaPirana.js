class PlantaPirana {
    constructor(scene, x, waterY) {
        this.scene = scene;
        this.x = x;
        this.tuboY = waterY;

        // Posiciones basadas en la implementación previa
        this.yEscondida = waterY + 20;
        // Altura de salto (pixels) — ajustar para que la planta salte más
        this.jumpHeight = 120; // valor aumentado para salto mayor
        this.yVisible = waterY - this.jumpHeight;

        // Visual size (single sprite)
        this.size = {w: 40, h: 40};

        // Crear un único sprite que representará la planta (depth menor que las tuberías)
        this.sprite = this.scene.add.image(this.x, this.yEscondida, 'fish_purple_down').setOrigin(0.5, 0.5).setDepth(100);
        this.sprite.setDisplaySize(this.size.w, this.size.h);

        // Compatibilidad con el código existente: exponer `cuerpo` y `cabeza` como alias al sprite
        this.cuerpo = this.sprite;
        this.cabeza = this.sprite;

        // Estado y temporizadores
        this.visible = false;
        this.activa = true;
        this.cicloTiempo = Date.now();
        this.duracionCiclo = 3000 + Math.random() * 2000; // 3-5s
        // Duraciones (ms) para subir / visible / bajar
        // Reducimos `tiempoVisible` para evitar que quede mucho tiempo parado en el aire
        this.tiempoSubida = 800;
        this.tiempoVisible = 80; // pausa muy corta en el pico
        this.tiempoBajada = 900;
        this.tiempoEscondida = 1500;
        this.fase = 'escondida'; // 'escondida','subiendo','visible','bajando'

        // Partículas: desactivadas para compatibilidad con Phaser >=3.60
        this.particles = null;
        this.emitter = null;
    }

    // Método llamado desde el bucle principal para actualizar la planta
    actualizar() {
        if (!this.activa) return;
        let tiempoActual = Date.now();
        let tiempoEnFase = tiempoActual - this.cicloTiempo;

        if (this.fase === 'escondida') {
            if (tiempoEnFase > this.tiempoEscondida) {
                this.fase = 'subiendo';
                this.cicloTiempo = tiempoActual;
                // Partículas deshabilitadas (no usar emitter para evitar errores en Phaser >=3.60)
            }
        } else if (this.fase === 'subiendo') {
            // Movimiento hacia arriba: usar sprite 'up' y aplicar easing CUBIC.Out (deceleración al llegar arriba)
            if (this.sprite.setTexture) this.sprite.setTexture('fish_purple_up');
            let progreso = Math.min(tiempoEnFase / this.tiempoSubida, 1);
            let eased = (typeof Phaser !== 'undefined' && Phaser.Math && Phaser.Math.Easing && Phaser.Math.Easing.Cubic) ? Phaser.Math.Easing.Cubic.Out(progreso) : progreso;
            let yActual = this.yEscondida + (this.yVisible - this.yEscondida) * eased;
            this.sprite.y = yActual;
            if (progreso >= 1) {
                this.fase = 'visible';
                this.visible = true;
                this.cicloTiempo = tiempoActual;
            }
        } else if (this.fase === 'visible') {
            if (tiempoEnFase > this.tiempoVisible) {
                this.fase = 'bajando';
                this.cicloTiempo = tiempoActual;
            }
        } else if (this.fase === 'bajando') {
            // Movimiento hacia abajo: usar sprite 'down' y easing 'Cubic.In' (aceleración al caer)
            if (this.sprite.setTexture) this.sprite.setTexture('fish_purple_down');
            let progreso = Math.min(tiempoEnFase / this.tiempoBajada, 1);
            let eased = (typeof Phaser !== 'undefined' && Phaser.Math && Phaser.Math.Easing && Phaser.Math.Easing.Cubic) ? Phaser.Math.Easing.Cubic.In(progreso) : progreso;
            let yActual = this.yVisible + (this.yEscondida - this.yVisible) * eased;
            this.sprite.y = yActual;
            if (progreso >= 1) {
                this.fase = 'escondida';
                this.visible = false;
                this.cicloTiempo = tiempoActual;
            }
        }
    }

    destroy() {
        try { if (this.sprite) this.sprite.destroy(); } catch (e) {}
        try { if (this.emitter) this.emitter.remove(); } catch (e) {}
        try { if (this.particles) this.particles.destroy(); } catch (e) {}
        this.activa = false;
    }
}

// Exponer globalmente para el navegador (index.html carga scripts)
window.PlantaPirana = PlantaPirana;
