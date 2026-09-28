import { Component, inject, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [],
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.scss',
})
export class MenuLateralComponent {
  private router = inject(Router);
  private eRef = inject(ElementRef);
  
  public isExpanded: boolean = true;
  public isPinned: boolean = true;

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isPinned = !this.isPinned;
    this.isExpanded = this.isPinned;
  }

  onMouseEnter() {
    if (!this.isPinned) {
      this.isExpanded = true;
    }
  }

  onMouseLeave() {
    if (!this.isPinned) {
      this.isExpanded = false;
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    // Only collapse on mobile/small screens if clicking outside, or keep default behavior 
    // depending on exact requirement. The user requested: 
    // "segundo cuando se presione fuera del menu deberia de desplazarse a la izquierda"
    if (this.isExpanded && !this.eRef.nativeElement.contains(event.target)) {
      this.isPinned = false;
      this.isExpanded = false;
    }
  }

  logout() {
    this.router.navigate(['/']);
  }
}
