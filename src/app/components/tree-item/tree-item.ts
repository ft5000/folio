import { CommonModule } from '@angular/common';
import { Component, ContentChildren, ElementRef, Input, QueryList } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'tree-item',
  imports: [CommonModule, RouterModule],
  templateUrl: './tree-item.html',
  styleUrls: ['./tree-item.scss'],
})
export class TreeItem {
  @Input() expanded: boolean = false;
  @Input() name: string = 'Item';
  @Input() link: string = '';

  // @ContentChildren('projected', { descendants: true, read: ElementRef })
  // projectedItems!: QueryList<ElementRef>;

  @ContentChildren(TreeItem, { descendants: true })
  children!: QueryList<TreeItem>;

  constructor() {}

  toggle() {
    if (!this.hasChildren) return;
    this.expanded = !this.expanded;
    if (!this.expanded) {
      this.collapseAllChildren();
    }
  }

  public get hasChildren(): boolean {
    return this.children && this.children.length > 0;
  }

  public get hasLink(): boolean {
    return this.link.length > 0;
  }

  private collapseAllChildren() {
    this.children.forEach(child => {
      child.expanded = false;
    });
  }
}
