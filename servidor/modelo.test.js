const modelo = require("./modelo.js");

// describe('El sistema...', function() {
//   let sistema;

//   beforeEach(function() {
//     sistema = new modelo.Sistema({test:true});
//   });

//   it('inicialmente no hay usuarios', function() {
//     expect(sistema.numeroUsuarios()).toEqual({num:0});
//   });

//   it('agregar usuario', function() {
//     sistema.agregarUsuario('Juan');
//     expect(sistema.numeroUsuarios()).toEqual({num:1});
//   });

//   it('eliminar usuario', function() {
//     sistema.agregarUsuario('Juan');
//     sistema.eliminarUsuario('Juan');
//     expect(sistema.numeroUsuarios()).toEqual({num:0});
//   });

//   it('obtener usuarios', function() {
//     sistema.agregarUsuario('Juan');
//     sistema.agregarUsuario('Pedro');
//     expect(sistema.obtenerUsuarios()).toEqual({
//       "Juan": {"nick":"Juan"},
//       "Pedro": {"nick":"Pedro"}
//     });
//   });

//   it('usuario activo', function() {
//     sistema.agregarUsuario('Juan');
//     expect(sistema.usuarioActivo('Juan')).toEqual({res:true});
//     expect(sistema.usuarioActivo('Pedro')).toEqual({res:false});
//   });
// });

//  describe("Pruebas de las partidas",function(){ 
//     let sistema;
//     let usr1; 
//     let usr2; 
//     let usr3; 
 
//     beforeEach(function(){ 
//       sistema = new modelo.Sistema({test:true});
//       usr1={"nick":"Pepe","email":"pepe@pepe.es"}; 
//       usr2={"nick":"Pepa","email":"pepa@pepa.es"}; 
//       usr3={"nick":"Pepo","email":"pepo@pepo.es"}; 
//       sistema.agregarUsuario(usr1); 
//       sistema.agregarUsuario(usr2); 
//       sistema.agregarUsuario(usr3); 
//     }); 
 
//     it("Usuarios y partidas en el sistema",function(){ 
//       expect(sistema.numeroUsuarios().num).toEqual(3); 
//       expect(sistema.obtenerPartidasDisponibles().length).toEqual(0); 
//     }); 
 
//     it("Crear partida",function(){ 
//       let resultado = sistema.crearPartida("pepe@pepe.es");
//       expect(resultado.codigo).toBeDefined();
//       expect(resultado.codigo).not.toEqual(-1);
//       expect(sistema.obtenerPartidasDisponibles().length).toEqual(1);
//     }); 
 
//     it("Unir a partida",function(){ 
//       let resultado = sistema.crearPartida("pepe@pepe.es");
//       let codigo = resultado.codigo;
//       let unir = sistema.unirAPartida("pepa@pepa.es", codigo);
//       expect(unir.codigo).toEqual(codigo);
//       // La partida ya no debe estar disponible (está llena con 2 jugadores)
//       expect(sistema.obtenerPartidasDisponibles().length).toEqual(0);
//     }); 
 
//     it("Un usuario no puede estar dos veces",function(){ 
//       let resultado = sistema.crearPartida("pepe@pepe.es");
//       let codigo = resultado.codigo;
//       // Intentar unir al mismo usuario que creó la partida
//       let unir = sistema.unirAPartida("pepe@pepe.es", codigo);
//       expect(unir.codigo).toEqual(-1);
//       expect(unir.error).toBeDefined();
//     }); 
 
//     it("Obtener partidas",function(){ 
//       sistema.crearPartida("pepe@pepe.es");
//       sistema.crearPartida("pepa@pepa.es");
//       let partidas = sistema.obtenerPartidasDisponibles();
//       expect(partidas.length).toEqual(2);
//       expect(partidas[0].creador).toBeDefined();
//       expect(partidas[0].codigo).toBeDefined();
//     }) 
//   }); 

  describe('Pruebas adicionales', function() {
    let sistema;
    beforeEach(function() {
      sistema = new modelo.Sistema({test:true});
    });

    it('obtenerCodigo genera códigos de 6 caracteres y no colisiona con partidas existentes', function() {
      // Simular una partida existente para forzar reintento si se genera igual
      sistema.partidas['ABCDEF'] = { codigo: 'ABCDEF', jugadores: [], maxJug: 2 };
      const c1 = sistema.obtenerCodigo();
      const c2 = sistema.obtenerCodigo();
      expect(typeof c1).toEqual('string');
      expect(c1.length).toEqual(6);
      expect(c1).not.toEqual(c2);
      // Asegurar que no devuelve un código que ya exista
      expect(c1 in sistema.partidas).toBe(false);
      expect(c2 in sistema.partidas).toBe(false);
    });

    it('obtenerPartidasDisponibles omite partidas llenas', function() {
      // Partida disponible
      sistema.partidas['P1'] = { codigo: 'P1', jugadores: [{email:'a@a'}], maxJug: 2 };
      // Partida llena
      sistema.partidas['P2'] = { codigo: 'P2', jugadores: [{email:'b@b'},{email:'c@c'}], maxJug: 2 };
      const lista = sistema.obtenerPartidasDisponibles();
      expect(lista.find(p => p.codigo === 'P1')).toBeDefined();
      expect(lista.find(p => p.codigo === 'P2')).toBeUndefined();
    });

    it('abandonarPartida elimina la partida y detecta si quien abandona es el creador', function() {
      // Crear partida con creador 'owner@t'
      sistema.partidas['XYZ123'] = { codigo: 'XYZ123', jugadores: [{email:'owner@t'},{email:'other@t'}], maxJug: 2 };
      const res = sistema.abandonarPartida('owner@t', 'XYZ123');
      expect(res.eliminada).toBe(true);
      expect(res.esCreador).toBe(true);
      expect(sistema.partidas['XYZ123']).toBeUndefined();
    });

    it('abandonarPartida devuelve eliminada:false si la partida no existe', function() {
      const res = sistema.abandonarPartida('no@one', 'NOEXISTE');
      expect(res.eliminada).toBe(false);
    });
  });