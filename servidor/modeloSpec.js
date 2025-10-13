const modelo = require("./modelo.js");

describe('El sistema...', function() {
  let sistema;

  beforeEach(function() {
    sistema = new modelo.Sistema();
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