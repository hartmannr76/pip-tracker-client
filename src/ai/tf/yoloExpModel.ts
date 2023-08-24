import { IBoundingBoxProps } from "types";
import * as tf from '@tensorflow/tfjs'
// import '@tensorflow/tfjs-backend-wasm';
// import {setWasmPaths} from '@tensorflow/tfjs-backend-wasm';
import { Tensor, Rank } from "@tensorflow/tfjs-core";
import { IObjectDetectionModel, model } from "ai";

export class YoloExperimentalV5Model implements IObjectDetectionModel {
  private loadedModelPromise?: Promise<tf.GraphModel>;
  private loadedModel?: tf.GraphModel;

  load(path = "./yolov5_custom/model.json"): Promise<tf.GraphModel> {
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

      const r = tf.tidy(() => {
        const newImage = tf.image.resizeBilinear(tf.browser.fromPixels(image), [modelWidth, modelHeight])
        .div(255.0).expandDims(0);

        const obj = net.execute(newImage) as Tensor<Rank.R3>;

        const reshaped = obj.squeeze();
        const [x, y, w, h] = reshaped.slice([0, 0], [-1, 4]).split(4, -1);
        const score = reshaped.slice([0, 4], [-1, 1]).squeeze() as Tensor<Rank.R1>;
        const bbox = tf.concat([x.sub(w.div(2)), y.sub(h.div(2)), x.add(w.div(2)), y.add(h.div(2))], -1);
        const {selectedIndices, selectedScores} =  tf.image.nonMaxSuppressionWithScore(bbox, score, 100, 0.5, 0.7);

        return [
          bbox.gather(selectedIndices),
          selectedScores,
          reshaped.slice([0, 5], [-1, -1]).argMax(-1).gather(selectedIndices),
        ];
      });
      
      const [boxes, scores, classes] = await Promise.all([r[0].array(), r[1].data(), r[2].data()]);

      const results: IBoundingBoxProps[] = []

      for (let i = 0; i < boxes.length; ++i) {
        if (scores[i] >= threshold) {
          let [x1,y1,x2,y2] = boxes[i];
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
            score: scores[i],
          });
        }
      }

      tf.dispose([boxes, scores, classes]);

    return results;
  };
}

const customTensorScatterUpdate = function(node){
    const tensor = node.inputs[0];
    const indices = node.inputs[1];
    const updates = node.inputs[2]
    const zeros = tf.zerosLike(updates)
    const a =  tf.mul(tensor, tf.scatterND(indices, zeros, tensor.shape));
    const b = tf.scatterND(indices, updates, tensor.shape);
    return a.add(b)
  }
// Required for V7
tf.registerOp('TensorScatterUpdate', customTensorScatterUpdate);

export class YoloExperimentalV7Model implements IObjectDetectionModel {
    private loadedModelPromise?: Promise<tf.GraphModel>;
    private loadedModel?: tf.GraphModel;
  
    load(path = "./exp/yolov7/320-tiny-silu-d3-w5/model.json"): Promise<tf.GraphModel> {
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
        console.log(tf.getBackend(), 'yolov7');
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
        let [width, height] = this.loadedModel!.inputs[0].shape!.slice(2, 4);
        return {width, height};
    };
  
    predictAndGetResults = async (
      image: HTMLCanvasElement|ImageBitmap, 
      threshold: number,
      imgHeight, imgWidth
      ): Promise<IBoundingBoxProps[]> => {
          let net = this.loadedModel!;
          let [modelWidth, modelHeight] = net.inputs[0].shape!.slice(2, 4);

            // Output node is in position 1 with shape (1, 3, 10, 10, 17)
            // squeeze to remove the empty dimension and reshape to combine 3*10*10
            const newImage = tf.tidy(() => {  
                return tf.image.resizeBilinear(tf.browser.fromPixels(image), [modelWidth, modelHeight])
                .div(255.0).expandDims(0).transpose([0, 3, 1, 2]);
                });
            const obj = (await net.executeAsync(newImage)) as Tensor<Rank>;
            const detections = (await obj.array()) as number[][];
      
            const results: IBoundingBoxProps[] = []
            const scaleWidth = imgWidth/modelWidth;
            const scaleHeight = imgHeight/modelHeight;
            
            for (let i = 0; i < detections.length; ++i) {
              if (detections[i][6] >= threshold) {
                // (centerx, centery, width, height)
                let [x1,y1,x2,y2] = detections[i].slice(1, 5);
                x1 *= scaleWidth;
                x2 *= scaleWidth;
                y1 *= scaleHeight;
                y2 *= scaleHeight;
    
                const text = detections[i][5]
    
                results.push({
                  xmin: x1,
                  xmax: x2,
                  ymin: y1,
                  ymax: y2,
                  class: this.labelMap[text]['name'],
                  predictedLabel: this.labelMap[text]['name'],
                  classIndex: text,
                  pipValue: this.labelMap[text]['displayValue'],
                  score: detections[i][6],
                });
              }
            }
      
            return results;
        };
}
