import * as tf from "@tensorflow/tfjs";
import { Button, CircularProgress, colors, FormControl, TextField, InputLabel, MenuItem, Paper, Select, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useRef, useState } from "react";
import { YoloObjectDetectionModel } from 'ai/tf/yoloModelTf';
import { SsdObjectDetectionModel } from 'ai/tf/ssdModel';
import { IObjectDetectionModel } from 'ai';
import { drawRect } from 'utils/drawing';
import { YoloExperimentalV5Model } from "ai/tf/yoloExpModel";

const Benchmark = () => {

    const [benchmarkState, setBenchmarkState] = useState({
        model: 1,
        runtime: 1,
        warmupIterations: 1,
        benchmarkItertations: 100,
        results: [] as string[],
    });
    const [benchmarkRunning, setBenchmarkRunning] = useState(false);

    const imageRef: React.MutableRefObject<HTMLImageElement|null> = useRef(null);
    const canvasRef: React.MutableRefObject<HTMLCanvasElement |null> = useRef(null);

    const handleModelChange = (evt) => {
        setBenchmarkState({
            ...benchmarkState,
            model: evt.target.value,
        });
    }

    const handleRuntimeChange = (evt) => {
        setBenchmarkState({
            ...benchmarkState,
            runtime: evt.target.value,
        });
    }

    const handleWarmupIterationsChange = (evt) => {
        setBenchmarkState({
            ...benchmarkState,
            warmupIterations: evt.target.value,
        });
    }

    const handleBenchmarkIterationsChange = (evt) => {
        setBenchmarkState({
            ...benchmarkState,
            benchmarkItertations: evt.target.value,
        });
    }

    const run = async () => {
        let benchModel: IObjectDetectionModel|null;
        const resultMessages: string[] = [];
        setBenchmarkRunning(true);
        
        switch (benchmarkState.model) {
            case 1:
                resultMessages.push('Model: YOLOV5');
                benchModel = new YoloObjectDetectionModel();
                break;
            case 2:
                resultMessages.push('Model: MobilenetSSD');
                benchModel = new SsdObjectDetectionModel();
                break;
            case 3:
                resultMessages.push('Model: YOLOV5 Custom');
                benchModel = new YoloExperimentalV5Model();
                break;
            default:
                return;
        }

        switch (benchmarkState.runtime) {
            case 1:
                resultMessages.push('Runtime: WebGL');
                tf.setBackend('webgl');
                break;
            case 2:
                resultMessages.push('Runtime: WASM');
                tf.setBackend('wasm');
                break;
        }
        if (!imageRef.current || !canvasRef.current) {
            return;
        }
        const imageData = await createImageBitmap(imageRef.current);
        const canvas = canvasRef.current;
        canvas.height = imageRef.current.offsetHeight;
        canvas.width = imageRef.current.offsetWidth;
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.height, canvas.width);

        await benchModel.load();

        const warmupStart = new Date();
        // warmup
        for (let i = 0; i < benchmarkState.warmupIterations; i++){
            await benchModel.predictAndGetResults(imageData, 0.7, imageRef.current.offsetHeight, imageRef.current.offsetWidth);
        }
        resultMessages.push(`Warmup: ${benchmarkState.warmupIterations} iterations in ${(new Date()).getTime() - warmupStart.getTime()}ms`);

        // run
        const benchmarkStart = new Date();
        let avg: number|null = null;
        let best: number|null = null;
        for (let i = 0; i < benchmarkState.benchmarkItertations; i++){
            const start = new Date();
            await benchModel.predictAndGetResults(imageData, 0.7, imageRef.current.offsetHeight, imageRef.current.offsetWidth);
            if (avg === null) {
                avg = (new Date()).getTime() - start.getTime();
                best = avg;
            } else {
                const runDuration = (new Date()).getTime() - start.getTime();
                avg = (avg + runDuration)/2;
                best = Math.min(best!, runDuration);
            }
        }
        resultMessages.push(`Benchmark: ${benchmarkState.benchmarkItertations} iterations in ${(new Date()).getTime() - benchmarkStart.getTime()}ms`)
        resultMessages.push(`Average run: ${avg}ms`);
        resultMessages.push(`Best run: ${best}ms`);
        resultMessages.push(`------------End of Run------------`);
            
        const result = await benchModel.predictAndGetResults(imageData, 0.7, imageRef.current.offsetHeight, imageRef.current.offsetWidth);
        drawRect(result, ctx);

        setBenchmarkState({
            ...benchmarkState,
            results: benchmarkState.results.concat(resultMessages),
        });
        setBenchmarkRunning(false);
    }

    return (
        <Box sx={{minHeight: '100vh'}} bgcolor={colors.grey[100]}>
            <Paper>
            <Typography variant="h5" gutterBottom component="div" sx={{ p: 2, pb: 0 }}>Benchmark</Typography>
            <FormControl>
                <InputLabel id="benchmark-select-model-label">Model</InputLabel>
                <Select
                    labelId="benchmark-select-model-label"
                    id="benchmark-select-model"
                    value={benchmarkState.model}
                    label="ML Model"
                    onChange={handleModelChange}
                >
                    <MenuItem value={1}>YoloV5</MenuItem>
                    <MenuItem value={2}>MobilenetSSD</MenuItem>
                    <MenuItem value={3}>(EXP) YoloV5 Custom</MenuItem>
                    <MenuItem value={4}>(EXP) YoloV7</MenuItem>
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id="benchmark-select-runtime-label">Runtime</InputLabel>
                <Select
                        labelId="benchmark-select-runtime-label"
                        id="benchmark-select-runtime"
                        value={benchmarkState.runtime}
                        label="Runtime"
                        onChange={handleRuntimeChange}
                    >
                        <MenuItem value={1}>WebGL</MenuItem>
                        <MenuItem value={2}>WASM</MenuItem>
                </Select>
            </FormControl>
            <TextField
                    id="benchmark-warmup"
                    value={benchmarkState.warmupIterations}
                    label="Warmup Iterations"
                    onChange={handleWarmupIterationsChange}
                    sx={{width: '15ch'}}
                />
            <TextField
                    id="benchmark-benchmark-runs"
                    value={benchmarkState.benchmarkItertations}
                    label="Benchmark Iterations"
                    onChange={handleBenchmarkIterationsChange}
                    sx={{width: '20ch'}}
                />
            <Button onClick={run}>Run</Button>
            </Paper>

            <div style={{'position': 'relative'}}>
                {benchmarkRunning && <CircularProgress sx={{position: 'absolute'}} />}
                <img ref={imageRef} src="/test-images/example1.jpg" style={{ 'maxWidth': '100%'}} />
                <canvas ref={canvasRef} id="draw_overlay" />
            </div>
            <div>
                {benchmarkState.results.map(r => (<p>{r}</p>))}
            </div>
        </Box>
    );
}

export default Benchmark;