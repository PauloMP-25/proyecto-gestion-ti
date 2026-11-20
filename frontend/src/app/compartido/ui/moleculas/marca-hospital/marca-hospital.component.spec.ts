import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarcaHospitalComponent } from './marca-hospital.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('MarcaHospitalComponent', () => {
  let component: MarcaHospitalComponent;
  let fixture: ComponentFixture<MarcaHospitalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcaHospitalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarcaHospitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente con textos oficiales', () => {
    expect(component).toBeTruthy();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Hospital Santa María del Socorro');
    expect(texto).toContain('Mesa de Ayuda');
  });

  it('en modo compacto no debe renderizar textos largos', () => {
    fixture.componentRef.setInput('modoCompacto', true);
    fixture.detectChanges();
    const textosEl = fixture.nativeElement.querySelector('.marca-hospital__textos');
    expect(textosEl).toBeNull();
  });
});
