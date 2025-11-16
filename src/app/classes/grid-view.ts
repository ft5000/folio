import { AfterViewInit, OnDestroy, OnInit } from "@angular/core";
import { Component } from "@angular/core";

@Component({
    selector: 'app-grid-view',
    template: '',
    styleUrls: []
})
export class GridView implements OnDestroy {
    private observer: IntersectionObserver | undefined;

    constructor() {}


    ngOnDestroy(): void {
        this.observer?.disconnect();
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
}