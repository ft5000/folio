import { CommonModule } from '@angular/common';
import { Component, ContentChildren, Input, QueryList } from '@angular/core';
import { ImageDTO } from '../../../types/image';
import moment from 'moment';

@Component({
  selector: 'grid-item',
  imports: [CommonModule],
  templateUrl: './grid-item.html',
  styleUrls: ['./grid-item.scss'],
})
export class GridItem {
  @Input() image: ImageDTO | null = null;
  hovered: boolean = false;

  @ContentChildren('content', { descendants: true })
  content!: QueryList<any>;

  public setHovered(state: boolean) {
    this.hovered = state;
  }

  public get title(): string {
    return this.image ? this.image.alt : '';
  }

  public get publishedDate(): string {
    if (!this.image || !this.image.publishedAt) return '';
    return moment(this.image.publishedAt).format('YYYY/MM/DD');
  }
}
