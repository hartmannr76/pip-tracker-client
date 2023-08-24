import { IBoundingBoxProps } from "types";
import * as tf from '@tensorflow/tfjs'
// import '@tensorflow/tfjs-backend-wasm';
// import {setWasmPaths} from '@tensorflow/tfjs-backend-wasm';
import { Tensor, Rank } from "@tensorflow/tfjs-core";
import { IObjectDetectionModel, model } from "ai";

export class YoloObjectDetectionModel implements IObjectDetectionModel {
  private loadedModelPromise?: Promise<tf.GraphModel>;
  private loadedModel?: tf.GraphModel;

  load(path = "./yolo_model/model.json"): Promise<tf.GraphModel> {
    if (this.loadedModelPromise) return this.loadedModelPromise;

    this.loadedModelPromise = new Promise(async (resolve, reject) => {
      // WASM has slower inference, but doesn't thrash the video
      // since it isn't competing for the GPU. Can't enable until 
      // next version for YOLO5
      // setWasmPaths('/');
      // tf.setBackend('wasm');
      tf.enableProdMode();
      this.loadedModel = await tf.loadGraphModel(path);
      resolve(this.loadedModel);
      console.log(tf.getBackend(), 'yolo');
    });

    return this.loadedModelPromise;
  }

  labelMap = {
    0:{name:'pip-1', displayValue: 1},
    1:{name:'pip-2', displayValue: 2},
    2:{name:'pip-3', displayValue: 3},
    3:{name:'pip-4', displayValue: 4},
    4:{name:'pip-5', displayValue: 5},
    5:{name:'pip-6', displayValue: 6},
    6:{name:'pip-7', displayValue: 7},
    7:{name:'pip-8', displayValue: 8},
    8:{name:'pip-9', displayValue: 9},
    9:{name:'pip-10', displayValue: 10},
    10:{name:'pip-11', displayValue: 11},
    11:{name:'pip-12', displayValue: 12},
  };

  get shape() {
      let [width, height] = this.loadedModel!.inputs[0].shape!.slice(1, 3);
      return {width, height};
  };

  predictAndGetResults = async (
    image: HTMLCanvasElement|ImageBitmap, 
    threshold: number,
    imgHeight, imgWidth
    ): Promise<IBoundingBoxProps[]> => {
        let net = this.loadedModel!;
        let [modelWidth, modelHeight] = net.inputs[0].shape!.slice(1, 3);
        let boxes, scores, classes, validDetectionsArray, validDetectionsData;

          const newImage = tf.tidy(() => {  
            return tf.image.resizeBilinear(tf.browser.fromPixels(image), [modelWidth, modelHeight])
            .div(255.0).expandDims(0);
          });
          const obj = (await net.executeAsync(newImage)) as Tensor<Rank.R4>[];
          
          [boxes, scores, classes, validDetectionsArray] = await Promise.all([obj[0].data(), obj[1].data(), obj[2].data(), obj[3].data()]);
          validDetectionsData = validDetectionsArray[0];
          tf.dispose(newImage);
    
          const results: IBoundingBoxProps[] = []
  
          for (let i = 0; i < validDetectionsData; ++i) {
            if (scores[i].toFixed(2) >= threshold) {
              let [x1,y1,x2,y2] = boxes.slice(i * 4, (i + 1) * 4);
              x1 *= imgWidth;
              x2 *= imgWidth;
              y1 *= imgHeight;
              y2 *= imgHeight;
  
              const text = classes[i]
  
              results.push({
                xmin: x1,
                xmax: x2,
                ymin: y1,
                ymax: y2,
                class: this.labelMap[text]['name'],
                predictedLabel: this.labelMap[text]['name'],
                classIndex: text,
                pipValue: this.labelMap[text].displayValue,
                score: scores[i].toFixed(2),
              });
            }
          }
    
          return results;
      };
}
