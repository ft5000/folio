import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SanityService } from '../../services/sanity';
import { Block, HeaderImageDTO, ProjectDTO } from '../../../types/project';
import { CommonModule } from '@angular/common';
import { GridItem } from '../grid-item/grid-item';
import { ImageDTO } from '../../../types/image';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Grid } from '../grid/grid';

@Component({
  selector: 'app-project-view',
  imports: [CommonModule, Grid, GridItem],
  templateUrl: './project-view.html',
  styleUrl: './project-view.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ProjectView implements OnInit, AfterViewInit {

  private projectTitle: string | null = null;
  public project: ProjectDTO | null = null;
  public headerImage: HeaderImageDTO | null = null;
  public projectImages: ImageDTO[] = [];
  public notFound: boolean = false;
  public tagsAppended: boolean = false;
  public isAnimating: boolean = false;
  public showImages: boolean = true;
  private _imagesNaturalHeight: number = 0;
  @ViewChild('imagesContainer') imagesContainer!: ElementRef<HTMLElement>;

  private loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loading.asObservable();

  subscribers: Subscription = new Subscription();

  constructor(private activatedRoute: ActivatedRoute, private sanityService: SanityService) {
    // document.body.style.setProperty('--fg-color', 'white');
    // document.body.style.setProperty('--bg-color', 'black');
  }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.load();
    this.subscribers.add(
      this.activatedRoute.paramMap.subscribe(() => {
      this.load();
      })
    );
  }

  private load(): void {
    this.loading.next(true);
    this.isAnimating = false;

    const id = this.getProjectIdFromRoute();
    this.projectTitle = id ? this.formatTitleFromId(id) : null;

    if (this.projectTitle) {
      this.sanityService.getProjectByTitle(this.projectTitle).subscribe((project: ProjectDTO) => {
        if (!project) {
          this.loading.next(false);
          this.notFound = true;
          return;
        }
        this.project = project;
        
        setTimeout(() => {
          this.isAnimating = true;
        }, 50);
        
        this.headerImage = project.headerImage as HeaderImageDTO;

        if (project && project.images) {
          this.projectImages = project.images as ImageDTO[];
          this.projectImages.push(this.headerImage as ImageDTO);
        }
        this.loading.next(false);
      });
    }
  }

  public toggleImages(): void {
    const el = this.imagesContainer.nativeElement;

    if (!this.showImages) {
      // EXPAND: use stored height so we don't read from a collapsed container
      this.showImages = true;
      el.style.transition = '';
      el.style.height = '0';
      void el.offsetHeight;
      el.style.transition = 'height 0.4s ease';
      el.style.height = this._imagesNaturalHeight + 'px';
      el.addEventListener('transitionend', () => {
        el.style.height = 'auto';
        el.style.transition = '';
      }, { once: true });
    } else {
      // COLLAPSE: measure while still open, store, then animate to 0
      el.style.height = 'auto';
      this._imagesNaturalHeight = el.scrollHeight;
      el.style.height = this._imagesNaturalHeight + 'px';
      void el.offsetHeight;
      el.style.transition = 'height 0.4s ease';
      el.style.height = '0';
      el.addEventListener('transitionend', () => {
        this.showImages = false;
        el.style.transition = '';
      }, { once: true });
    }
  }

  private getProjectIdFromRoute(): string | null {
    return this.activatedRoute.snapshot.paramMap.get('projectId');
  }

  private formatTitleFromId(projectId: string): string {
    return projectId.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private setColorScheme(bgColor: string, textColor: string, accentColor: string): void {
    document.body.style.setProperty('--project-bg', bgColor ? bgColor : '#ffffff');
    document.body.style.setProperty('--project-text', textColor ? textColor : '#000000');
    document.body.style.setProperty('--project-accent', accentColor ? accentColor : '#000000');
    document.body.style.setProperty('--bg-color', accentColor ? accentColor : '#000000');;
  }

  public renderSpan(span: any, block: Block): string {
    let text = span.text;
    
    if (span.marks && span.marks.length > 0) {
      span.marks.forEach((mark: string) => {
        const markDef = block.markDefs.find(def => def._key === mark);
        
        if (markDef) {
          switch (markDef._type) {
            case 'link':
              text = `<a href="${markDef.href}" class="project-link" target="_blank" rel="noopener noreferrer">${text.toUpperCase()}</a>`;
              break;
          }
        } else {
          // Handle decorators (bold, italic, etc.)
          switch (mark) {
            case 'strong':
              text = `<strong>${text}</strong>`;
              break;
            case 'em':
              text = `<em>${text}</em>`;
              break;
          }
        }
      });
    }
    
    return text;
  }
}
