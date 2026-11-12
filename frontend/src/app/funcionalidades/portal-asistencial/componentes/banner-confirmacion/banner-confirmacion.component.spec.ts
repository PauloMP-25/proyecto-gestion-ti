import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BannerConfirmacionComponent } from './banner-confirmacion.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('BannerConfirmacionComponent', () => {
  let component: BannerConfirmacionComponent;
  let fixture: ComponentFixture<BannerConfirmacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerConfirmacionComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BannerConfirmacionComponent);
    component = fixture.componentInstance;
  });

  it('no debe renderizar nada si conteo es 0', () => {
    fixture.componentRef.setInput('conteo', 0);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.banner-confirmacion');
    expect(banner).toBeNull();
  });

  it('debe renderizar aviso accesible si conteo > 0', () => {
    fixture.componentRef.setInput('conteo', 1);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.banner-confirmacion');
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.textContent).toContain('1 solicitud ya fue atendida');
  });
});
