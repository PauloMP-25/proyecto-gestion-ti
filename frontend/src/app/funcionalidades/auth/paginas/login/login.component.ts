import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private router = inject(Router);
  public isDesignTwo = false;

  login() {
    this.router.navigate(['/panel-control']);
  }

  toggleDesign() {
    this.isDesignTwo = !this.isDesignTwo;
  }
}
