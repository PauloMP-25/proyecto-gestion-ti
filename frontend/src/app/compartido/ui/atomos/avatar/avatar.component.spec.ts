import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente con valores por defecto', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement.querySelector('.avatar');
    expect(el.textContent.trim()).toBe('U');
    expect(el.classList.contains('avatar--md')).toBe(true);
  });

  it('debe calcular las iniciales de 2 palabras', () => {
    fixture.componentRef.setInput('nombre', 'María Huamán');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.avatar');
    expect(el.textContent.trim()).toBe('MH');
  });

  it('debe calcular las iniciales de una sola palabra', () => {
    fixture.componentRef.setInput('nombre', 'Administrador');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.avatar');
    expect(el.textContent.trim()).toBe('AD');
  });

  it('debe asignar clases semánticas según el rol', () => {
    fixture.componentRef.setInput('rol', RolUsuario.ADMINISTRADOR);
    fixture.detectChanges();
    let el = fixture.nativeElement.querySelector('.avatar');
    expect(el.classList.contains('avatar--admin')).toBe(true);

    fixture.componentRef.setInput('rol', RolUsuario.PRACTICANTE);
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('.avatar');
    expect(el.classList.contains('avatar--practicante')).toBe(true);

    fixture.componentRef.setInput('rol', RolUsuario.USUARIO_FINAL);
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('.avatar');
    expect(el.classList.contains('avatar--usuario')).toBe(true);
  });
});
