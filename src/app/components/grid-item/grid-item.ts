import { CommonModule, DatePipe } from '@angular/common';
import { Component, ContentChildren, Input, QueryList, ViewChild } from '@angular/core';
import { ImageDTO } from '../../../types/image';
import { VideoDTO, VideoThumbnailDTO } from '../../../types/video';
import { VideoContainer } from '../video-container/video-container';

export enum GridItemType {
    None = '',
    Image = 'image',
    Video = 'video',
  }

@Component({
  selector: 'grid-item',
  imports: [CommonModule, VideoContainer],
  templateUrl: './grid-item.html',
  styleUrls: ['./grid-item.scss'],
})
export class GridItem {
  @ViewChild('gridItem', { static: true }) gridItemElement!: any;
  @Input() image: ImageDTO | null = null;
  @Input() video: VideoDTO | null = null;
  @Input() videoThumbnail: VideoThumbnailDTO | null = null;
  @Input() showDefault: boolean = false;
  @Input() showTitle: boolean = true;
  @Input() showPublishDate: boolean = true;
  hovered: boolean = false;

  private datePipe = new DatePipe('en-US');

  @ContentChildren('content', { descendants: true })
  content!: QueryList<any>;

  public setHovered(state: boolean) {
    this.hovered = state;
  }

  public get title(): string {
    switch (this.gridItemType) {
      case GridItemType.Image:
        return this.image!.alt;
      case GridItemType.Video:
        if (this.videoThumbnail) {
          return this.videoThumbnail.title;
        }
        else if (this.video) {
          return this.video.title;
        }
        return '';
      default:
        return '';
    }
  }

  private get gridItemType(): GridItemType {
    if (this.image) return GridItemType.Image;
    if (this.video) return GridItemType.Video;
    if (this.videoThumbnail) return GridItemType.Video;
    return GridItemType.None;
  }

  public get publishedDate(): string {
    switch (this.gridItemType) {
      case GridItemType.Image:
        return this.datePipe.transform(this.image!.publishedAt, 'yyyy-MM-dd') || '';
      case GridItemType.Video:
        if (this.videoThumbnail) {
          return this.datePipe.transform(this.videoThumbnail.publishedAt, 'yyyy-MM-dd') || '';
        }
        else if (this.video) {
          return this.datePipe.transform(this.video.publishedAt, 'yyyy-MM-dd') || '';
        }
        return '';
      default:
        return '';
    }
  }

  public get show(): boolean {
    return this.gridItemElement.nativeElement.classList.contains('show');
  }
}
