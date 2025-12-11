import { ImageDTO } from "./image";

export interface ProjectDTO {
    _createdAt: string;
    _id: string;
    _rev: string;
    _type: "project";
    _updatedAt: string;
    title: string;
    description: Block[];
    headerImage: HeaderImageDTO;
    images: ImageDTO[];
    tags: string[];
    bgColor: string;
    textColor: string;
    accentColor: string;
}

export interface ProjectImageDTO {
    _key: string;
    alt: string;
    image: ImageDTO;
    publishedAt: string;
    title: string;
}

export interface HeaderImageDTO {
    imageUrl: string;
}

export interface Block {
    _key: string;
    _type: "block";
    children: Span[];
    markDefs: MarkDef[];
    style: string;
}

export interface Span {
    _key: string;
    _type: "span";
    marks: string[];
    text: string;
}

export interface MarkDef {
    _key: string;
    _type: string;
    href?: string;
}