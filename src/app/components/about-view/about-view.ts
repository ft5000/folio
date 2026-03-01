import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-about-view',
  imports: [CommonModule],
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
