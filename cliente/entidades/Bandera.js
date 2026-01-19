class Bandera {
    constructor(scene, metaX, metaY) {
        this.scene = scene;
        this.x = metaX;
        this.y = metaY;

        // Antes había un rectángulo gris como mástil. Lo eliminamos y
        // devolvemos un objeto compatible con `.x` para el código existente.
        this.mastil = { x: this.x };

        // Parámetros de tile para componer la bandera
        this.tileH = 32;
        this.tileW = 32;

        // Calcular filas que caben en el mástil (aproximado)
        const mastilHeight = 300;
        const rows = Math.max(3, Math.floor(mastilHeight / this.tileH));

        // Posicionar la bandera justo a la derecha del mástil
        const flagX = this.x + 25;
        const topY = (this.y - 150) - (mastilHeight / 2) + (this.tileH / 2);

        this.sprites = [];

        // Crear animación 'flag-wave' si no existe (alternar red_a/red_b)
        if (!this.scene.anims.exists('flag-wave')) {
            this.scene.anims.create({
                key: 'flag-wave',
                frames: [ { key: 'flag_red_a' }, { key: 'flag_red_b' } ],
                frameRate: 6,
                repeat: -1
            });
        }

        // Construir la columna: fila 0 = top animado, filas 1..n-2 = off_center, fila n-1 = off_bottom
        for (let r = 0; r < rows; r++) {
            const yPos = topY + r * this.tileH;

            if (r === 0) {
                // Top animado
                const s = this.scene.add.sprite(flagX, yPos, 'flag_red_a').setOrigin(0.5, 0.5).setDepth(400);
                s.setDisplaySize(this.tileW, this.tileH);
                s.play('flag-wave');
                this.sprites.push(s);
            } else if (r === rows - 1) {
                // Bottom
                const s = this.scene.add.image(flagX, yPos, 'flag_off_bottom').setOrigin(0.5, 0.5).setDepth(400);
                s.setDisplaySize(this.tileW, this.tileH);
                this.sprites.push(s);
            } else {
                // Center
                const s = this.scene.add.image(flagX, yPos, 'flag_off_center').setOrigin(0.5, 0.5).setDepth(400);
                s.setDisplaySize(this.tileW, this.tileH);
                this.sprites.push(s);
            }
        }

        // Zona de detección de meta (igual que antes)
        this.zonaMeta = this.scene.add.rectangle(this.x, this.y - 100, 80, 400, 0x00ff00, 0);
        try {
            this.scene.physics.add.existing(this.zonaMeta, true);
        } catch (e) {
            // En algunos contextos la física aún no existe; el caller puede añadirla.
        }
        this.zonaMeta.isMeta = true;
    }

    getMastil() { return this.mastil; }
    getZonaMeta() { return this.zonaMeta; }

    destroy() {
        try { this.mastil.destroy(); } catch (e) {}
        try { this.zonaMeta.destroy(); } catch (e) {}
        this.sprites.forEach(s => { try { s.destroy(); } catch (e) {} });
        this.sprites = [];
    }
}

window.Bandera = Bandera;
