import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { P5PathsComponent } from './components/p5-paths.component';
import { NavBar } from './components/nav-bar/nav-bar';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, P5PathsComponent, NavBar],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit, AfterViewInit {
  public isMobile: boolean = false;
  public canScrollDown: boolean = false;

  subscribers: Subscription = new Subscription();

  constructor(private router: Router) {
  }

  ngOnInit(): void {
    this.isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    this.subscribers.add(this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      setTimeout(() => this.updateCanScrollDown(), 500);
    }));
  }

  // Compute once and on viewport changes so Angular change detection updates the template.

  @HostListener('window:scroll', [])
  onscroll() {
    this.updateCanScrollDown();
  }

  @HostListener('window:resize', [])
  onresize() {
    this.updateCanScrollDown();
  }

  @HostListener('window:orientationchange', [])
  onorientationchange() {
    this.updateCanScrollDown();
  }
  

  private updateCanScrollDown(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.canScrollDown = false;
      return;
    }

    const el = document.scrollingElement || document.documentElement;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight ?? el.clientHeight;
    const scrollTop = el.scrollTop ?? window.pageYOffset ?? 0;
    const scrollHeight = el.scrollHeight ?? 0;

    const next = scrollTop + viewportHeight < scrollHeight - 1;
    if (next !== this.canScrollDown) this.canScrollDown = next;
  };

  ngAfterViewInit(): void {
    setTimeout(() => this.updateCanScrollDown(), 500);
  }
}
