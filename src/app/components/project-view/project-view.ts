import { AfterViewInit, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SanityService } from '../../services/sanity';
import { Block, HeaderImageDTO, ProjectDTO } from '../../../types/project';
import { CommonModule } from '@angular/common';
import { GridItem } from '../grid-item/grid-item';
import { ImageDTO } from '../../../types/image';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-project-view',
  imports: [CommonModule, GridItem],
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
    this.subscribers.add(this.loading$.subscribe((isLoading) => {
      if (!isLoading && this.project) {
        this.setColorScheme(this.project.bgColor, this.project.textColor, this.project.accentColor);
      }
    }));
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
        }
        this.loading.next(false);
      });
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
              text = `<a href="${markDef.href}" class="project-link" target="_blank" rel="noopener noreferrer">${text}</a>`;
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
