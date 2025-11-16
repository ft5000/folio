import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'sketches',
        loadComponent: () => import('./components/sketches-view/sketches-view').then(m => m.SketchesView)
    },
    {
        path: 'crawl',
        loadComponent: () => import('./components/image-crawl-view/image-crawl-view').then(m => m.ImageCrawlView)
    },
    {
        path: 'about',
        loadComponent: () => import('./components/about-view/about-view').then(m => m.AboutView)
    }
];
