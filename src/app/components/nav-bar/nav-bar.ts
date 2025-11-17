import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { TreeItem } from '../tree-item/tree-item';

export enum NavItem {
  About = 'About',
  Projects = 'Projects',
  Sketches = 'Sketches',
  Crawl = 'Image Crawl'
}

@Component({
  selector: 'nav-bar',
  imports: [CommonModule, TreeItem],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar implements AfterViewInit {
  @ViewChild('tree') tree!: ElementRef;

  public NavItem = NavItem;
  public isMouseInside: boolean = false;

  constructor() {
  }

  ngAfterViewInit() {
    this.tree.nativeElement.addEventListener('mouseenter', () => {
      this.isMouseInside = true;
    });

    this.tree.nativeElement.addEventListener('mouseleave', () => {
      this.isMouseInside = false;
    });
  }
}
