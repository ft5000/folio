import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-about-view',
  imports: [CommonModule, LogoComponent],
  templateUrl: './about-view.html',
  styleUrl: './about-view.scss',
})
export class AboutView {

  constructor() {}

  public getSpacerContent(): string {
    return ' ';
  }

  public get year(): number {
    return new Date().getFullYear();
  }
}
