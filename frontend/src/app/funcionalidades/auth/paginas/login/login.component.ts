import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private router = inject(Router);
  public activeDesign: number = 1;

  login() {
    this.router.navigate(['/panel-control']);
  }

  setDesign(designNumber: number) {
    this.activeDesign = designNumber;
  }
}
