import { Component } from '@angular/core';
import { ImageDTO } from '../../../types/image';
import { SanityService } from '../../services/sanity';
import { CommonModule } from '@angular/common';
import { GridItem } from '../grid-item/grid-item';
import { VideoContainer } from '../video-container/video-container';
import { GridView } from '../../classes/grid-view';

@Component({
  selector: 'app-image-crawl-view',
  imports: [CommonModule, GridItem],
  templateUrl: './image-crawl-view.html',
  styleUrl: './image-crawl-view.scss',
})
export class ImageCrawlView extends GridView {
  public images: ImageDTO[] = [];

  mo: MutationObserver | null = null;

  constructor(private sanity: SanityService) {
    super();
  }

  ngOnInit() {
    this.sanity.getAllImages().subscribe((data: ImageDTO[]) => {
      this.images = data;
      this.setupItemObserver();
    });

    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'black');
  }
}
