import { Component, ContentChildren, ElementRef, HostListener, Input, OnDestroy, OnInit, QueryList, TemplateRef } from '@angular/core';
import { GridItem } from '../grid-item/grid-item';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'grid',
  imports: [CommonModule],
  templateUrl: './grid.html',
  styleUrls: ['./grid.scss'],
})
export class Grid implements OnDestroy, OnInit {
  private observer: IntersectionObserver | undefined;
  public cols: number = 1;
  @Input() maxCols: number = 4;
  @Input() minColWidth: number = 200;

  @ContentChildren(TemplateRef) templates!: QueryList<TemplateRef<any>>;
  
  constructor() {
  }
  
  ngOnInit(): void {
    this.calculateColumns();
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateColumns();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  protected setCols(cols: number) {
    this.cols = cols;
    this.observer?.disconnect();
    this.setupItemObserver();
  }

  protected setupItemObserver() {
    setTimeout(() => {
      const item = document.querySelectorAll('.grid-item');
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('show');
            this.observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      item.forEach(item => this.observer?.observe(item));
    });
  }

  public get colArray(): number[] {
    return Array.from({ length: this.cols }, (_, i) => i);
  }

  protected calculateColumns() {
    const width = window.innerWidth;
    let cols = Math.max(1, Math.min(this.maxCols, Math.floor(width / this.minColWidth)));
    this.setCols(cols);
  }
}
