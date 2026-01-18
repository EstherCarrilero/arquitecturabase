class Moneda {
    constructor(scene, x, y, id) {
        this.scene = scene;
        this.id = id;
        this.activa = true;

        // Crear sprite de moneda con física ligera
        try {
            this.sprite = scene.physics.add.sprite(x, y, 'coin_gold');
            this.sprite.setDisplaySize(24, 24);
            this.sprite.body.setAllowGravity(false);
            this.sprite.body.setImmovable(true);
            // Aumentar tamaño de la hitbox física para facilitar la recogida
            try {
                const hitSize = 36; // ancho/alto de la hitbox
                if (this.sprite.body.setSize) {
                    this.sprite.body.setSize(hitSize, hitSize, false);
                    // Centrar el cuerpo respecto al sprite
                    const offsetX = (this.sprite.displayWidth - hitSize) / 2;
                    const offsetY = (this.sprite.displayHeight - hitSize) / 2;
                    if (this.sprite.body.setOffset) this.sprite.body.setOffset(offsetX, offsetY);
                }
            } catch (ee) {}
        } catch (e) {
            // Fallback si no hay physics disponible (por ejemplo en tests)
            this.sprite = scene.add.image(x, y, 'coin_gold');
            this.sprite.setDisplaySize(24, 24);
        }

        // Referencia hacia la instancia para accesos desde colisiones
        this.sprite.monedaRef = this;

        // Animación simple: alternar textura para dar sensación de giro
        this._toggle = false;
        try {
            this._animTimer = scene.time.addEvent({ delay: 180, callback: () => {
                if (!this.activa) return;
                try {
                    this.sprite.setTexture(this._toggle ? 'coin_gold_side' : 'coin_gold');
                } catch (e) {}
                this._toggle = !this._toggle;
            }, loop: true });
        } catch (e) {
            // Ignore if scene.time not available
            this._animTimer = null;
        }
    }

    getSprite() { return this.sprite; }
    getId() { return this.id; }
    isActiva() { return this.activa; }

    recoger() {
        if (!this.activa) return;
        this.activa = false;

        // Detener la animación
        try { if (this._animTimer) this._animTimer.remove(); } catch (e) {}

        // Ocultar y desactivar física
        try {
            if (this.sprite.body) {
                this.sprite.body.enable = false;
            }
            this.sprite.setVisible(false);
        } catch (e) {}

        // Destruir después de un pequeño retraso
        setTimeout(() => {
            try { if (this.sprite && this.sprite.destroy) this.sprite.destroy(); } catch (e) {}
        }, 300);
    }

    destroy() {
        try { if (this._animTimer) this._animTimer.remove(); } catch (e) {}
        try { if (this.sprite) this.sprite.destroy(); } catch (e) {}
    }

    // Crea una línea de monedas y devuelve un array de instancias
    static crearLinea(scene, startX, y, count, spacing, startId) {
        const arr = [];
        for (let i = 0; i < count; i++) {
            const m = new Moneda(scene, startX + i * spacing, y, startId + i);
            arr.push(m);
        }
        return arr;
    }
}
