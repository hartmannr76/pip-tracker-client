import { IBoundingBoxProps } from "types";
import * as tf from '@tensorflow/tfjs'
import { IObjectDetectionModel } from "ai";
import { Tensor, Rank } from "@tensorflow/tfjs-core";

export class SsdObjectDetectionModel implements IObjectDetectionModel {
  private loadedModelPromise?: Promise<tf.GraphModel>;
  private loadedModel?: tf.GraphModel;

  load(path = "./model/model.json"): Promise<tf.GraphModel> {
    if (this.loadedModelPromise) return this.loadedModelPromise;

    this.loadedModelPromise = new Promise(async (resolve, reject) => {
      this.loadedModel = await tf.loadGraphModel(path);
      resolve(this.loadedModel);
      console.log(tf.getBackend(), 'ssd');
    });

    return this.loadedModelPromise;
  }

  labelMap = {
    1:{name:'pip-1', displayValue: 1},
    2:{name:'pip-2', displayValue: 2},
    3:{name:'pip-3', displayValue: 3},
    4:{name:'pip-4', displayValue: 4},
    5:{name:'pip-5', displayValue: 5},
    6:{name:'pip-6', displayValue: 6},
    7:{name:'pip-7', displayValue: 7},
    8:{name:'pip-8', displayValue: 8},
    9:{name:'pip-9', displayValue: 9},
    10:{name:'pip-10', displayValue: 10},
    11:{name:'pip-11', displayValue: 11},
    12:{name:'pip-12', displayValue: 12},
  };

  shape = { width: 300, height: 300 }

  predictAndGetResults = async (
    image: HTMLCanvasElement|ImageBitmap, 
    threshold: number,
    imgHeight, imgWidth
    ): Promise<IBoundingBoxProps[]> => {
            let boxes, classes, scores;
            let net = this.loadedModel!;
              const newImage = tf.tidy(() => {
                const img = tf.browser.fromPixels(image);
                return tf.expandDims(tf.cast(img, 'int32'))
              });
              const obj = (await net.executeAsync(newImage)) as Tensor<Rank.R4>[];
              [boxes, classes, scores] = await Promise.all([obj[1].array(), obj[2].data(), obj[4].array()]);
              tf.dispose(newImage);
      
            const results: IBoundingBoxProps[] = []
    
            scores[0].forEach((score, i) => {
              if (score>threshold && boxes[0][i]) {
                const [y,x,height,width] = boxes[0][i]
                const minY = y * imgHeight;
                const minX = x * imgWidth;
                const maxY = height * imgHeight;
                const maxX = width * imgWidth;
                const text = classes[i]
      
                results.push({
                  xmin: minX,
                  xmax: maxX,
                  ymin: minY,
                  ymax: maxY,
                  predictedLabel: this.labelMap[text]['name'],
                  class: this.labelMap[text]['name'],
                  classIndex: text,
                  pipValue: this.labelMap[text].displayValue,
                  score,
                })
              }
            });
      
            return results;
        };
}
