import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class NavBar {

  public NavItem = NavItem;

  constructor() {
  }
}
