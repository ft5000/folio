import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';
import { AppService } from '../../services/app';

@Component({
  selector: 'app-about-view',
  imports: [CommonModule, LogoComponent],
  templateUrl: './about-view.html',
  styleUrl: './about-view.scss',
})
export class AboutView implements OnInit {
  public isMobile: boolean = false;

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.appService.isMobile$.subscribe(isMobile => {
      this.isMobile = isMobile;
    });
  }

  public getSpacerContent(): string {
    return ' ';
  }

  public get year(): number {
    return new Date().getFullYear();
  }
}
