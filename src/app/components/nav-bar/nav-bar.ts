import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NavItem, NavLinks } from '../nav-links/nav-links';

@Component({
  selector: 'nav-bar',
  imports: [CommonModule, NavLinks],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tree') tree!: ElementRef;

  public NavItem = NavItem;
  public isMouseInside: boolean = false;
  public expanded: boolean = false;

  public projectTitles: string[] = [];

  subscribers: Subscription = new Subscription();

  constructor(private router: Router) {
  }

  ngOnDestroy(): void {
    this.subscribers.unsubscribe();
    document.body.style.overflow = '';
  }

  ngOnInit(): void {
    this.subscribers.add(this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.expanded = false;
      document.body.style.overflow = '';
    }));
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.expanded && !this.tree.nativeElement.contains(event.target) && !(event.target as HTMLElement).closest('.nav-button')) {
      this.expanded = false;
      document.body.style.overflow = '';
    }
  }

  ngAfterViewInit() {
    this.tree.nativeElement.addEventListener('mouseenter', () => {
      this.isMouseInside = true;
    });

    this.tree.nativeElement.addEventListener('mouseleave', () => {
      this.isMouseInside = false;
    });
  }

  public toggleExpand() {
    this.expanded = !this.expanded;

    if (this.expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}
