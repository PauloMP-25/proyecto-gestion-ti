import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';
import { CampoFormularioComponent } from '../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { DialogoFormularioComponent } from '../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { PrestamosStore } from '../../estado/prestamos.store';
import { EntregarPrestamoForm } from '../../modelos/prestamos.model';

interface EquipoOpcion {
  idCi: number;
  codigoInventario: string;
  nombre: string;
  tipoCi: string;
  marcaModelo?: string;
  estado?: string;
}

interface AreaOpcion {
  id: number;
  nombre: string;
  piso?: number;
}

@Component({
  selector: 'app-dialogo-entregar-prestamo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogoFormularioComponent,
    CampoFormularioComponent,
  ],
  templateUrl: './dialogo-entregar-prestamo.component.html',
  styleUrl: './dialogo-entregar-prestamo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoEntregarPrestamoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  readonly store = inject(PrestamosStore);

  readonly cerrado = output<boolean>();

  readonly equiposDisponibles = signal<EquipoOpcion[]>([]);
  readonly areasHospitalarias = signal<AreaOpcion[]>([]);
  readonly cargandoRecursos = signal<boolean>(true);
  readonly errorGeneral = signal<string | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    // Calculamos fecha pactada por defecto: 24 horas después
    const fechaDefecto = new Date(Date.now() + 24 * 3600 * 1000);
    const fechaPactadaStr = fechaDefecto.toISOString().slice(0, 16);

    this.form = this.fb.group({
      idCi: [null, [Validators.required]],
      idAreaDestino: [null, [Validators.required]],
      solicitante: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      fechaDevolucionPactada: [fechaPactadaStr, [Validators.required]],
      idTicket: [null],
      observaciones: ['', [Validators.maxLength(250)]],
    });

    this.cargarCatalogos();
  }

  private cargarCatalogos(): void {
    this.cargandoRecursos.set(true);
    // Cargamos equipos y áreas
    this.http.get<any>(`${API_ENDPOINTS.admin.equipos || API_ENDPOINTS.tickets}?tamano=100`).subscribe({
      next: (resp) => {
        const contenido = resp?.contenido || resp || [];
        this.equiposDisponibles.set(
          contenido.map((e: any) => ({
            idCi: e.idCi || e.id,
            codigoInventario: e.codigoInventario || `EQ-${e.id}`,
            nombre: e.nombre || e.nombreEquipo || 'Equipo',
            tipoCi: e.tipoCi || e.tipo || 'General',
            marcaModelo: e.marcaModelo || e.modelo || '',
            estado: e.estado || 'OPERATIVO',
          }))
        );
      },
      error: () => {
        // Fallback lista básica
        this.equiposDisponibles.set([
          { idCi: 1, codigoInventario: 'EQ-CONT-01', nombre: 'Laptop HP Contingencia', tipoCi: 'Computadora Portátil' },
          { idCi: 2, codigoInventario: 'IMP-CONT-02', nombre: 'Impresora Térmica Tickets', tipoCi: 'Impresora' },
        ]);
      },
    });

    this.http.get<any[]>(API_ENDPOINTS.areas).subscribe({
      next: (areas) => {
        this.areasHospitalarias.set(
          (areas || []).map((a: any) => ({
            id: a.idArea || a.id,
            nombre: a.nombre,
            piso: a.piso,
          }))
        );
        this.cargandoRecursos.set(false);
      },
      error: () => {
        this.areasHospitalarias.set([
          { id: 1, nombre: 'Admisión Central', piso: 1 },
          { id: 2, nombre: 'Emergencia General', piso: 1 },
          { id: 3, nombre: 'Farmacia Hospitalaria', piso: 1 },
          { id: 4, nombre: 'UCI Adultos', piso: 2 },
        ]);
        this.cargandoRecursos.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const req: EntregarPrestamoForm = {
      idCi: Number(val.idCi),
      idAreaDestino: Number(val.idAreaDestino),
      solicitante: val.solicitante.trim(),
      fechaDevolucionPactada: new Date(val.fechaDevolucionPactada).toISOString(),
      idTicket: val.idTicket ? Number(val.idTicket) : null,
      observaciones: val.observaciones?.trim() || null,
    };

    this.store.entregarEquipo(req, () => {
      this.cerrado.emit(true);
    });
  }

  cerrar(): void {
    this.cerrado.emit(false);
  }

  obtenerError(campo: string): string | null {
    const ctrl = this.form.get(campo);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres.`;
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    return 'Dato no válido.';
  }
}
