class BloqueRompible {
    constructor(scene, x, y, id) {
        this.scene = scene;
        this.id = id;
        // Imagen del bloque rompible
        this.sprite = scene.add.image(x, y, 'block_planks').setOrigin(0.5, 0.5);
        this.sprite.setDisplaySize(30, 30);
        try { scene.physics.add.existing(this.sprite, true); } catch (e) {}

        this.sprite.tipo = 'rompible';
        this.sprite.id = id;
        this.sprite.roto = false;
    }

    getSprite() { return this.sprite; }

    romper() {
        if (this.sprite && this.sprite.destroy) this.sprite.destroy();
    }

    destroy() { try { if (this.sprite) this.sprite.destroy(); } catch (e) {} }
}
