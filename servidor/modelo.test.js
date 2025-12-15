const modelo = require("./modelo.js");

describe('El sistema...', function() {
  let sistema;

  beforeEach(function() {
    sistema = new modelo.Sistema({test:true});
  });

  it('inicialmente no hay usuarios', function() {
    expect(sistema.numeroUsuarios()).toEqual({num:0});
  });

  it('agregar usuario', function() {
    sistema.agregarUsuario('Juan');
    expect(sistema.numeroUsuarios()).toEqual({num:1});
  });

  it('eliminar usuario', function() {
    sistema.agregarUsuario('Juan');
    sistema.eliminarUsuario('Juan');
    expect(sistema.numeroUsuarios()).toEqual({num:0});
  });

  it('obtener usuarios', function() {
    sistema.agregarUsuario('Juan');
    sistema.agregarUsuario('Pedro');
    expect(sistema.obtenerUsuarios()).toEqual({
      "Juan": {"nick":"Juan"},
      "Pedro": {"nick":"Pedro"}
    });
  });

  it('usuario activo', function() {
    sistema.agregarUsuario('Juan');
    expect(sistema.usuarioActivo('Juan')).toEqual({res:true});
    expect(sistema.usuarioActivo('Pedro')).toEqual({res:false});
  });
});

 describe("Pruebas de las partidas",function(){ 
    let sistema;
    let usr1; 
    let usr2; 
    let usr3; 
 
    beforeEach(function(){ 
      sistema = new modelo.Sistema({test:true});
      usr1={"nick":"Pepe","email":"pepe@pepe.es"}; 
      usr2={"nick":"Pepa","email":"pepa@pepa.es"}; 
      usr3={"nick":"Pepo","email":"pepo@pepo.es"}; 
      sistema.agregarUsuario(usr1); 
      sistema.agregarUsuario(usr2); 
      sistema.agregarUsuario(usr3); 
    }); 
 
    it("Usuarios y partidas en el sistema",function(){ 
      expect(sistema.numeroUsuarios().num).toEqual(3); 
      expect(sistema.obtenerPartidasDisponibles().length).toEqual(0); 
    }); 
 
    it("Crear partida",function(){ 
      let resultado = sistema.crearPartida("pepe@pepe.es");
      expect(resultado.codigo).toBeDefined();
      expect(resultado.codigo).not.toEqual(-1);
      expect(sistema.obtenerPartidasDisponibles().length).toEqual(1);
    }); 
 
    it("Unir a partida",function(){ 
      let resultado = sistema.crearPartida("pepe@pepe.es");
      let codigo = resultado.codigo;
      let unir = sistema.unirAPartida("pepa@pepa.es", codigo);
      expect(unir.codigo).toEqual(codigo);
      // La partida ya no debe estar disponible (está llena con 2 jugadores)
      expect(sistema.obtenerPartidasDisponibles().length).toEqual(0);
    }); 
 
    it("Un usuario no puede estar dos veces",function(){ 
      let resultado = sistema.crearPartida("pepe@pepe.es");
      let codigo = resultado.codigo;
      // Intentar unir al mismo usuario que creó la partida
      let unir = sistema.unirAPartida("pepe@pepe.es", codigo);
      expect(unir.codigo).toEqual(-1);
      expect(unir.error).toBeDefined();
    }); 
 
    it("Obtener partidas",function(){ 
      sistema.crearPartida("pepe@pepe.es");
      sistema.crearPartida("pepa@pepa.es");
      let partidas = sistema.obtenerPartidasDisponibles();
      expect(partidas.length).toEqual(2);
      expect(partidas[0].creador).toBeDefined();
      expect(partidas[0].codigo).toBeDefined();
    }) 
  }); 