const modelo = require("./modelo.js");

describe('El sistema...', function() {
  let sistema;
  
  beforeEach(function() {
    sistema = new modelo.Sistema();
  });

  it('inicialmente no hay usuarios', function() {
    expect(sistema.numeroUsuarios()).toEqual(0);
  });

  it('agregar usuario', function() {
    sistema.agregarUsuario('Juan');
    expect(sistema.numeroUsuarios()).toEqual(1);
  });

  it('eliminar usuario', function() {
    sistema.agregarUsuario('Juan');
    sistema.eliminarUsuario('Juan');
    expect(sistema.numeroUsuarios()).toEqual(0);
  });

  it('obtener usuarios', function() {
    sistema.agregarUsuario('Juan');
    sistema.agregarUsuario('Pedro');
    expect(sistema.obtenerUsuarios()).toEqual({
      Juan: jasmine.any(Usuario),
      Pedro: jasmine.any(Usuario)
    });
  });

  it('usuario activo', function() {
    sistema.agregarUsuario('Juan');
    expect(sistema.usuarioActivo('Juan')).toBeTrue();
    expect(sistema.usuarioActivo('Pedro')).toBeFalse();
  });
});