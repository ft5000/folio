import { Component, OnInit } from '@angular/core';
import { VideoDTO } from '../../../types/video';
import { SanityService } from '../../services/sanity';
import { VideoContainer } from '../video-container/video-container';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sketches-view',
  imports: [CommonModule, VideoContainer],
  templateUrl: './sketches-view.html',
  styleUrl: './sketches-view.scss',
})
export class SketchesView implements OnInit {
  items: VideoDTO[] | null = null;

  constructor(private sanity: SanityService) {}

  ngOnInit(): void {
    this.sanity.getAllVideos().subscribe((data: VideoDTO[]) => {
      this.items = data;
    });
    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'blue');
  }

}
