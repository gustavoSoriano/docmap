// Tipos para novas funcionalidades do canvas:
// - Ferramenta de inspeção de elementos HTML
// - Importação de arquivo HTML por caminho

export interface ElementData {
  readonly tag: string;
  readonly id: string | null;
  readonly classes: readonly string[];
  readonly attributes: Readonly<Record<string, string>>;
  readonly textContent: string;
  readonly boundingRect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface CanvasInspectRequest {
  readonly element: ElementData;
  readonly userText: string;
}

export interface CanvasInspectResponse {
  readonly prompt: string;
  readonly elementDescription: string;
}

export interface CanvasImportFileRequest {
  readonly filePath: string;
}

export interface CanvasImportFileResponse {
  readonly success: boolean;
  readonly path: string;
  readonly fileSize: number;
  readonly preview: string;
}
