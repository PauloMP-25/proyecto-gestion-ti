import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-base-conocimiento-editor',
  standalone: true,
  imports: [],
  templateUrl: './base-conocimiento-editor.component.html',
  styleUrl: './base-conocimiento-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseConocimientoEditorComponent {}
