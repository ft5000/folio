import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavLinks } from '../nav-links/nav-links';

@Component({
  selector: 'side-bar',
  imports: [CommonModule, NavLinks],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.scss',
})
export class SideBar {
  public expanded: boolean = true;

  constructor() {}

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }
}
