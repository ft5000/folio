import { Injectable } from '@angular/core';
import { createClient } from '@sanity/client';
import groq from 'groq';
import { BehaviorSubject, Observable } from 'rxjs';
import { ImageDTO } from '../../types/image';
import { VideoDTO } from '../../types/video';
import { ProjectDTO } from '../../types/project';

@Injectable({
  providedIn: 'root',
})
export class SanityService {
  private client = createClient({
    projectId: 'nznn7r7s',
    dataset: 'production',
    apiVersion: '2025-01-01',
    useCdn: false, // Disable CDN to avoid CORS issues in development
  });

  private loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public loading$ = this.loading.asObservable();

  public getPosts(): Observable<ImageDTO> {
    this.loading.next(true);
    const query = groq`*[_type == "blogPost"]{title, slug, body}`;
    return new Observable<any>(observer => {
      this.client.fetch(query)
        .then(data => {
          observer.next(data);
          this.loading.next(false);
          observer.complete();
        })
        .catch(err => { observer.error(err); this.loading.next(false); });
    });
  }

  public getAllImages(): Observable<ImageDTO[]> {
    this.loading.next(true);
    const query = groq`*[_type == "imagePost"]{
      _id,
      title,
      "imageUrl": image.asset->url,
      alt,
      caption,
      publishedAt
    } | order(publishedAt desc)`;
    return new Observable<ImageDTO[]>(observer => {
      this.client.fetch(query)
      .then(data => {
        observer.next(data);
        this.loading.next(false);
        observer.complete();
      })
      .catch(err => { observer.error(err); this.loading.next(false); });
    });
  }

  public getImageByTitle(title: string): Observable<ImageDTO> {
    this.loading.next(true);
    const query = groq`*[_type == "imagePost" && title == $title][0]{
      _id,
      title,
      "imageUrl": image.asset->url,
      alt,
      caption,
      publishedAt
    }`;
    return new Observable<ImageDTO>(observer => {
      this.client.fetch(query, { title })
        .then(data => {
          observer.next(data);
          this.loading.next(false);
          observer.complete();
        })
        .catch(err => { observer.error(err); this.loading.next(false); });
    });
  }

  public getAllVideos(): Observable<VideoDTO[]> {
    this.loading.next(true);
    const query = groq`*[_type == "videoPost"]{
      _id,
      title,
      "videoUrl": video.asset->url,
      description,
      publishedAt
    } | order(publishedAt desc)`;
    return new Observable<VideoDTO[]>(observer => {
      this.client.fetch(query)
      .then(data => {
        observer.next(data);
        this.loading.next(false);
        observer.complete();
      })
      .catch(err => { observer.error(err); this.loading.next(false); });
    });
  }

  public getAllProjectTitles(): Observable<string[]> {
    this.loading.next(true);
    const query = groq`*[_type == "project"]{
      title
    } | order(title asc)`;
    return new Observable<string[]>(observer => {
      this.client.fetch(query)
      .then(data => {
        const titles = data.map((item: any) => item.title);
        observer.next(titles);
        this.loading.next(false);
        observer.complete();
      })
      .catch(err => { observer.error(err); this.loading.next(false); });
    });
  }

  public getProjectByTitle(title: string): Observable<ProjectDTO> {
    this.loading.next(true);
    const query = groq`*[_type == "project" && title == $title][0]{
      _id,
      _createdAt,
      _updatedAt,
      _rev,
      title,
      headerImage{
        "imageUrl": asset->url
      },
      description,
      tags,
      images[]{
        _key,
        title,
        alt,
        caption,
        publishedAt,
        "imageUrl": image.asset->url
      },
      "bgColor": bgColor.hex,
      "textColor": textColor.hex,
      "accentColor": accentColor.hex
    }`;
    return new Observable<ProjectDTO>(observer => {
      this.client.fetch(query, { title })
      .then(data => {
        observer.next(data);
        this.loading.next(false);
        observer.complete();
      })
      .catch(err => {observer.error(err); this.loading.next(false);});
    });
  }
}