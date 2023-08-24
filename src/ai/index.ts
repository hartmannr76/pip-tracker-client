import * as tf from "@tensorflow/tfjs";
import { IBoundingBoxProps } from "types";
import { YoloObjectDetectionModel } from "./tf/yoloModelTf";
import { YoloExperimentalV5Model } from "./tf/yoloExpModel";
import { SsdObjectDetectionModel } from "./tf/ssdModel";

export interface IObjectDetectionModel {
  load(): Promise<tf.GraphModel>;
  predictAndGetResults(
    image: HTMLCanvasElement|ImageBitmap, 
    threshold: number,
    imgHeight, imgWidth
    ): Promise<IBoundingBoxProps[]>;
  labelMap: object;
  shape: {
    width: number,
    height: number
  }
}

// Forcing 16bit FP gives small perf boost but suffered in performance.
// tf.ENV.set('WEBGL_FORCE_F16_TEXTURES', true);
export const model = new YoloExperimentalV5Model();
// load in the background on start
if (typeof window !== 'undefined') {
  model.load();
}