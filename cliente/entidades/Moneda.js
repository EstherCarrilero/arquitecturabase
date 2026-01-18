class Moneda {
    constructor(scene, x, y, id) {
        this.scene = scene;
        this.id = id;
        this.activa = true;
        
        // Crear sprite de la moneda (círculo amarillo dorado)
        this.sprite = scene.add.circle(x, y, 8, 0xFFD700);
    }
    
    getSprite() {
        return this.sprite;
    }
    
    getId() {
        return this.id;
    }
    
    isActiva() {
        return this.activa;
    }
    
    recoger() {
        this.sprite.setVisible(false);
        this.activa = false;
    }
    
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
    
    // Método estático para crear monedas en un array
    static crearMonedas(scene, posiciones) {
        const monedas = [];
        let idCounter = 0;
        
        posiciones.forEach(pos => {
            const moneda = new Moneda(scene, pos.x, pos.y, idCounter++);
            monedas.push(moneda);
        });
        
        return monedas;
    }
    
    // Método estático para crear línea de monedas
    static crearLinea(scene, x, y, cantidad, espaciado, idInicial) {
        const monedas = [];
        
        for (let i = 0; i < cantidad; i++) {
            const moneda = new Moneda(scene, x + i * espaciado, y, idInicial + i);
            monedas.push(moneda);
        }
        
        return monedas;
    }
}
