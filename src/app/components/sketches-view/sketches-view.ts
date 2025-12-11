import { Component, OnInit } from '@angular/core';
import { VideoDTO } from '../../../types/video';
import { SanityService } from '../../services/sanity';
import { CommonModule } from '@angular/common';
import { GridItem } from '../grid-item/grid-item';
import { GridView } from '../../classes/grid-view';
import { Grid } from '../grid/grid';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sketches-view',
  imports: [CommonModule, GridItem, Grid],
  templateUrl: './sketches-view.html',
  styleUrl: './sketches-view.scss',
})
export class SketchesView extends GridView implements OnInit {
  items: VideoDTO[] | null = null;

  public loading$: Observable<boolean> | null = null;

  constructor(private sanityService: SanityService) {
    super();
    this.loading$ = this.sanityService.loading$;
  }

  ngOnInit(): void {
    this.sanityService.getAllVideos().subscribe((data: VideoDTO[]) => {
      this.items = data;
      this.setupItemObserver();
    });
    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'blue');
  }

}
