import { CommonModule } from '@angular/common';
import { Component, ContentChildren, Input, OnDestroy, OnInit, QueryList } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'tree-item',
  imports: [CommonModule, RouterModule],
  templateUrl: './tree-item.html',
  styleUrls: ['./tree-item.scss'],
})
export class TreeItem implements OnInit, OnDestroy {
  @Input() expanded: boolean = false;
  @Input() name: string = 'Item';
  @Input() link: string = '';
  isActive: boolean = false;

  private subscriptions: Subscription = new Subscription();

  @ContentChildren(TreeItem, { descendants: true })
  children!: QueryList<TreeItem>;

  constructor(private router: Router) {}
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnInit() {
    this.subscriptions.add(this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isActive = this.link.length > 0 && this.router.url.startsWith(this.link);
      }
    }));
  }

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
