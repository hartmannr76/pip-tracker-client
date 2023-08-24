import { db } from "db";
import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useState } from "react";
import {ISnapshotProps, SnapshotContextType} from '../types';

export const snapshotDetailsContext = createContext<SnapshotContextType|null>(null);

export const saveOrUpdateSnapshot = async (currentSnapshot: ISnapshotProps) => {
  const currentTotal = currentSnapshot.boundingBoxProps.reduce((prev, curr) => prev + curr.pipValue, 0);
  if (currentSnapshot.id === undefined) {
    await db.snapshotRecords.add({
      boundingBoxProps: JSON.stringify(currentSnapshot.boundingBoxProps),
      imageHeight: currentSnapshot.imageHeight,
      imageWidth: currentSnapshot.imageWidth,
      imageData: currentSnapshot.imageData,
      total: currentTotal,
    });
  } else {
    await db.snapshotRecords.update(currentSnapshot.id, {
      'boundingBoxProps': JSON.stringify(currentSnapshot.boundingBoxProps),
      'total': currentTotal
    });
  }
}

export const SnapshotDetailsProvider = (props) => {
  const [activeSnapshot, setSnapshot] = useState<ISnapshotProps|null>(null);

  const setActiveSnapshot = (snapshot: ISnapshotProps) => {
    setSnapshot(snapshot);
  }

  const isBrowser = typeof window !== 'undefined';

  const dbImageData = useLiveQuery(() => isBrowser ? db.snapshotRecords.toArray() : []);
  const allImages = dbImageData?.map(item => ({
    boundingBoxProps: JSON.parse(item.boundingBoxProps),
    imageData: item.imageData!,
    imageHeight: item.imageHeight,
    imageWidth: item.imageWidth,
    total: item.total,
    id: item.id!,
  })) || [];  

  return <snapshotDetailsContext.Provider 
    value={{activeSnapshot, setActiveSnapshot, allImages, loading: dbImageData == null}}>
    {props.children}
  </snapshotDetailsContext.Provider>
}
