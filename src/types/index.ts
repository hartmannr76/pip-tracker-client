export type SnapshotContextType = {
  activeSnapshot: ISnapshotProps|null;
  setActiveSnapshot: (snapshot: ISnapshotProps) => void;
  allImages: ISnapshotProps[];
  loading: boolean;
};

export interface ISnapshotProps {
  id?: number;
  imageData: string;
  imageWidth: number;
  imageHeight: number;
  boundingBoxProps: IBoundingBoxProps[];
  total?: number;
}

export interface IBoundingBoxProps {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  class: string;
  classIndex: number;
  pipValue: number;
  predictedLabel: string;
  score?: number;
}

export interface IDrawRectProps {
  debug?: boolean;
  highlightIndex?: number | undefined;
}
