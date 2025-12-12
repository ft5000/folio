import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { P5PathsComponent } from './components/p5-paths.component';
import { NavBar } from './components/nav-bar/nav-bar';
import { filter, Observable, Subscription } from 'rxjs';
import { NavLinks } from './components/nav-links/nav-links';
import { SanityService } from './services/sanity';

const mobileLayoutBreakpoint = 768;

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
  public useMobileLayout: boolean = false;
  public currentRoute: string = '';

  subscribers: Subscription = new Subscription();

  public loading$: Observable<boolean> | null = null;

  constructor(private router: Router, private sanityService: SanityService) {
    this.loading$ = this.sanityService.loading$;
  }

  ngOnInit(): void {
    this.isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    
    // Track route changes to force component reconstruction
    this.subscribers.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        scrollTo(0, 0);
      })
    );

    this.checkUseMobileLayout();

    this.subscribers.add(this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      setTimeout(() => this.updateCanScrollDown(), 500);
    }));
  }

  @HostListener('window:scroll', [])
  onscroll() {
    this.updateCanScrollDown();
  }

  @HostListener('window:resize', [])
  onresize() {
    this.updateCanScrollDown();
    this.checkUseMobileLayout();
  }

  @HostListener('window:orientationchange', [])
  onorientationchange() {
    this.updateCanScrollDown();
    this.checkUseMobileLayout();
  }

  private checkUseMobileLayout(): void {
    this.useMobileLayout = window.innerWidth < mobileLayoutBreakpoint;
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
