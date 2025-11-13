import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MultiTreeItem } from '../multi-tree-item/multi-tree-item';

export enum NavItem {
  About = 'About',
  Projects = 'Projects',
  Sketches = 'Sketches',
  Crawl = 'Crawl'
}

@Component({
  selector: 'nav-bar',
  imports: [CommonModule, MultiTreeItem],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar implements OnInit {

  public NavItem = NavItem;

  public items: { name: NavItem; expanded: boolean }[] = []

  constructor() {

  }

  ngOnInit(): void {
    this.items = Object.values(NavItem).map(item => ({ name: item, expanded: false }));
  }

  toggle(item: NavItem) {
    const itemObj = this.items.find(i => i.name === item);
    if (itemObj) {
      itemObj.expanded = !itemObj.expanded;
    }
  }

  public isExpanded(item: NavItem): boolean {
    return this.items.some(i => i.name === item && i.expanded);
  }
}
