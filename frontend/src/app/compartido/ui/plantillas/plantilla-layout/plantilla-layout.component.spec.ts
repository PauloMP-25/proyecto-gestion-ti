import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlantillaLayoutComponent } from './plantilla-layout.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PlantillaLayoutComponent', () => {
  let component: PlantillaLayoutComponent;
  let fixture: ComponentFixture<PlantillaLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlantillaLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlantillaLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente con estructura semántica de shell', () => {
    expect(component).toBeTruthy();
    const shell = fixture.nativeElement.querySelector('.shell-layout');
    const main = fixture.nativeElement.querySelector('main[role="main"]');
    expect(shell).toBeTruthy();
    expect(main).toBeTruthy();
  });
});
