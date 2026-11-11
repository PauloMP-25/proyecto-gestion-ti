import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TieneRolDirective } from './tiene-rol.directive';
import { AuthService } from './auth.service';
import { RolUsuario } from '../modelos/rol.enum';

@Component({
  imports: [TieneRolDirective],
  template: `<p *appTieneRol="roles">contenido restringido</p>`,
})
class HostComponent {
  roles: RolUsuario[] = [RolUsuario.ADMINISTRADOR];
}

describe('TieneRolDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra el contenido solo cuando el rol actual coincide', () => {
    const auth = TestBed.inject(AuthService);
    auth.cambiarRol(RolUsuario.USUARIO_FINAL);

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('contenido restringido');

    auth.cambiarRol(RolUsuario.ADMINISTRADOR);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('contenido restringido');
  });
});