import { Injectable } from '@angular/core';
import { createClient } from '@sanity/client';
import groq from 'groq';
import { Observable } from 'rxjs';
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

  public getPosts(): Observable<ImageDTO> {
    const query = groq`*[_type == "blogPost"]{title, slug, body}`;
    return new Observable<any>(observer => {
      this.client.fetch(query)
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }

  public getAllImages(): Observable<ImageDTO[]> {
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
        observer.complete();
      })
      .catch(err => observer.error(err));
    });
  }

  public getImageByTitle(title: string): Observable<ImageDTO> {
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
          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }

  public getAllVideos(): Observable<VideoDTO[]> {
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
        observer.complete();
      })
      .catch(err => observer.error(err));
    });
  }

  public getAllProjectTitles(): Observable<string[]> {
    const query = groq`*[_type == "project"]{
      title
    } | order(title asc)`;
    return new Observable<string[]>(observer => {
      this.client.fetch(query)
      .then(data => {
        const titles = data.map((item: any) => item.title);
        observer.next(titles);
        observer.complete();
      })
      .catch(err => observer.error(err));
    });
  }

  public getProjectByTitle(title: string): Observable<ProjectDTO> {
    const query = groq`*[_type == "project" && title == $title][0]{
      _id,
      _createdAt,
      _updatedAt,
      _rev,
      title,
      description,
      tags,
      images[]{
        _key,
        title,
        alt,
        caption,
        publishedAt,
        "image": {
          title,
          "imageUrl": image.asset->url,
          alt,
          caption,
          publishedAt
        }
      }
    }`;
    return new Observable<ProjectDTO>(observer => {
      this.client.fetch(query, { title })
      .then(data => {
        observer.next(data);
        observer.complete();
      })
      .catch(err => observer.error(err));
    });
  }
}