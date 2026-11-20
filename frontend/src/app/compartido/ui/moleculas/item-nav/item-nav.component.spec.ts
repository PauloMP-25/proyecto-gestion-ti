import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ItemNavComponent } from './item-nav.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ItemNavComponent', () => {
  let component: ItemNavComponent;
  let fixture: ComponentFixture<ItemNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemNavComponent],
      providers: [provideRouter([{ path: 'portal', component: ItemNavComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemNavComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('titulo', 'Inicio');
    fixture.componentRef.setInput('ruta', '/portal');
    fixture.componentRef.setInput('icono', 'home');
    fixture.detectChanges();
  });

  it('debe crearse y renderizar título e icono', () => {
    expect(component).toBeTruthy();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Inicio');
    expect(texto).toContain('home');
  });

  it('debe emitir clickItem al hacer clic en el enlace', async () => {
    let emitido = false;
    component.clickItem.subscribe(() => {
      emitido = true;
    });

    const enlace = fixture.nativeElement.querySelector('a');
    enlace.click();
    await fixture.whenStable();
    expect(emitido).toBe(true);
  });

  it('debe renderizar el badge si se le proporciona y no está colapsado', () => {
    fixture.componentRef.setInput('badge', '3');
    fixture.componentRef.setInput('badgeTipo', 'sla-alerta');
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.item-badge');
    expect(badgeEl).toBeTruthy();
    expect(badgeEl.textContent.trim()).toBe('3');
    expect(badgeEl.classList.contains('sla-alerta')).toBe(true);
  });
});
