import { Component, OnInit } from '@angular/core';
import { VideoDTO } from '../../../types/video';
import { SanityService } from '../../services/sanity';
import { VideoContainer } from '../video-container/video-container';
import { CommonModule } from '@angular/common';
import { GridItem } from '../grid-item/grid-item';
import { GridView } from '../../classes/grid-view';

@Component({
  selector: 'app-sketches-view',
  imports: [CommonModule, VideoContainer, GridItem],
  templateUrl: './sketches-view.html',
  styleUrl: './sketches-view.scss',
})
export class SketchesView extends GridView implements OnInit {
  items: VideoDTO[] | null = null;

  constructor(private sanity: SanityService) {
    super()
  }

  ngOnInit(): void {
    this.sanity.getAllVideos().subscribe((data: VideoDTO[]) => {
      this.items = data;
      this.setupItemObserver();
    });
    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'blue');
  }

}
