import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SanityService } from '../../services/sanity';
import { Block, ProjectDTO, ProjectImageDTO } from '../../../types/project';
import { CommonModule } from '@angular/common';
import { Grid } from '../grid/grid';
import { GridItem } from '../grid-item/grid-item';
import { ImageDTO } from '../../../types/image';
import { WindowComponent } from '../window/window';
import { BehaviorSubject, filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-project-view',
  imports: [CommonModule, Grid, GridItem, WindowComponent],
  templateUrl: './project-view.html',
  styleUrl: './project-view.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ProjectView implements OnInit, AfterViewInit {

  private projectTitle: string | null = null;
  public project: ProjectDTO | null = null;
  public projectImages: ImageDTO[] = [];
  public notFound: boolean = false;
  private viewInitialized: boolean = false;
  public tagsAppended: boolean = false;
  public isAnimating: boolean = false;

  private loaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public loaded$ = this.loaded.asObservable();

  subscribers: Subscription = new Subscription();

  constructor(private activatedRoute: ActivatedRoute, private sanityService: SanityService) {
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
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
    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'black');

    this.isAnimating = false;

    const id = this.getProjectIdFromRoute();
    this.projectTitle = id ? this.formatTitleFromId(id) : null;

    if (this.projectTitle) {
      this.sanityService.getProjectByTitle(this.projectTitle).subscribe((project: ProjectDTO) => {
        if (!project) {
          this.notFound = true;
          this.loaded.next(true);
          return;
        }
        this.project = project;
        
        setTimeout(() => {
          this.isAnimating = true;
        }, 50);
        
        if (project && project.images) {
          this.projectImages = project.images.map((pi: ProjectImageDTO) => pi.image);
        }
        this.loaded.next(true);
      });
    }
  }

  private getProjectIdFromRoute(): string | null {
    return this.activatedRoute.snapshot.paramMap.get('projectId');
  }

  private formatTitleFromId(projectId: string): string {
    return projectId.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
