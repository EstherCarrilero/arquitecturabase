class Bloque {
    constructor(scene, x, y, id) {
        this.scene = scene;
        this.id = id;
        // Crear imagen del bloque normal
        this.sprite = scene.add.image(x, y, 'bricks_brown').setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(30, 30);
        // Añadir física estática para colisiones
        try { scene.physics.add.existing(this.sprite, true); } catch (e) {}

        // Propiedades esperadas por el código existente
        this.sprite.tipo = 'normal';
        this.sprite.id = id;
    }

    getSprite() { return this.sprite; }

    destroy() {
        try { if (this.sprite) this.sprite.destroy(); } catch (e) {}
    }
}
