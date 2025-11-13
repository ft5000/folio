import { CommonModule } from '@angular/common';
import { Component, ContentChildren, ElementRef, Input, QueryList } from '@angular/core';

@Component({
  selector: 'multi-tree-item',
  imports: [CommonModule],
  templateUrl: './multi-tree-item.html',
  styleUrl: './multi-tree-item.scss',
})
export class MultiTreeItem {
  expanded: boolean = false;
  @Input() name: string = 'Item';

  @ContentChildren('projected', { descendants: true, read: ElementRef })
  projectedItems!: QueryList<ElementRef>;

  toggle() {
    this.expanded = !this.expanded;
    console.log(`Toggled ${this.name} to ${this.expanded}`);
  }

  public get hasChildren(): boolean {
    return this.projectedItems && this.projectedItems.length > 0;
  }

}
