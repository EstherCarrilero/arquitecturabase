class BloquePregunta {
    constructor(scene, x, y, id, contenido) {
        this.scene = scene;
        this.id = id;
        this.contenido = contenido || 'moneda';

        // Sprite base: mostrar la versión ACTIVA inicialmente
        this.sprite = scene.add.image(x, y, 'block_exclamation_active').setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(30, 30);
        try { scene.physics.add.existing(this.sprite, true); } catch (e) {}

        // Propiedades utilizadas por el juego
        this.sprite.tipo = 'pregunta';
        this.sprite.id = id;
        this.sprite.usado = false;
        this.sprite.contenido = this.contenido;

        // Dejar referencia genial para compatibilidad
        this.sprite.bloquePreguntaRef = this;
    }

    getSprite() { return this.sprite; }

    activarVisual() {
        try { if (this.sprite && this.sprite.setTexture) this.sprite.setTexture('block_exclamation_active'); } catch (e) {}
    }

    destroy() { try { if (this.sprite) this.sprite.destroy(); } catch (e) {} }
}
