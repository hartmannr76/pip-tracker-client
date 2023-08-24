import { colors } from '@mui/material';
import { colorMap } from "../constants";
import {IBoundingBoxProps, IDrawRectProps} from '../types';

export const drawRect = (predictionResults: IBoundingBoxProps[], ctx, 
    {debug, highlightIndex}: IDrawRectProps = {debug: false}
      )=>{
    predictionResults.forEach((result, i) => {
        const { xmin: minX, xmax: maxX, ymin: minY, ymax: maxY, score = 0 } = result;
        const classIndex = result.classIndex;
        const label = result.class;
        const font = '12px sans-serif'
  
        ctx.strokeStyle = highlightIndex !== null && highlightIndex === i ? colors.orange[500] : '#1976d2';
        ctx.strokeStyle = debug ? colorMap[classIndex]['color'] : ctx.strokeStyle;
        ctx.lineWidth = 2
        ctx.font = font
        ctx.textBaseline = 'top' 
     
        ctx.fillStyle = 'black';
        const text = debug ? label + ' - ' + Math.round(score*100)/100 : label;
        const textWidth = ctx.measureText(text).width;
        const textHeight = parseInt(font, 10); // base 10
        ctx.fillRect(minX, minY, textWidth + 8, textHeight + 4);
  
        
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.fillText(text, minX+4, minY+2)
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.stroke()
    });
  }