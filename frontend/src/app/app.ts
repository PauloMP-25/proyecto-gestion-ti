import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacionToastComponent } from './compartido/ui/organismos/notificacion-toast/notificacion-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificacionToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
