import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoCliente } from '../../compartido/modelos/ticket.dto';
import { TicketsService } from '../../compartido/servicios/tickets/tickets.service';

@Injectable({ providedIn: 'root' })
export class ContextoClienteService {
  private ticketsService = inject(TicketsService);

  obtener(): Observable<ContextoCliente> {
    return this.ticketsService.contextoCliente();
  }
}