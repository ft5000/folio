import { AfterViewInit, Component, ComponentFactory, ComponentFactoryResolver, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { ImageDTO } from '../../../types/image';
import { SanityService } from '../../services/sanity';
import { CommonModule } from '@angular/common';
import { GridItem } from '../grid-item/grid-item';
import { GridView } from '../../classes/grid-view';
import { Grid } from '../grid/grid';

@Component({
  selector: 'app-image-crawl-view',
  imports: [CommonModule, GridItem, Grid],
  templateUrl: './image-crawl-view.html',
  styleUrl: './image-crawl-view.scss',
})
export class ImageCrawlView extends GridView implements OnInit {
  public images: ImageDTO[] = [];

  constructor(private sanity: SanityService) {
    super();
  }

  ngOnInit() {
    this.sanity.getAllImages().subscribe((data: ImageDTO[]) => {
      this.images = data;
      document.body.style.setProperty('--fg-color', 'white');
      document.body.style.setProperty('--bg-color', 'black');
      this.setupItemObserver();
    });
  }
}
