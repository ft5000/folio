import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SanityService } from './services/sanity';
import { CommonModule } from '@angular/common';
import { ImageDTO } from '../types/image';
import { VideoDTO } from '../types/video';
import { VideoContainer } from './components/video-container/video-container';
import { P5PathsComponent } from './components/p5-paths.component';
import { NavBar } from './components/nav-bar/nav-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, P5PathsComponent, NavBar],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  constructor() {
  }

  public get canScrollDown(): boolean {
    return window.innerHeight + window.scrollY < document.documentElement.scrollHeight;
  }
}
