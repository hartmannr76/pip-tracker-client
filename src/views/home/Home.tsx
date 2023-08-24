import { CameraEnhance, MoreVert, DeleteForever, CloudUpload, MenuBook } from "@mui/icons-material";
import { Alert, AppBar, colors, Fab, IconButton, ImageList, ImageListItem, ImageListItemBar, Link, Menu, MenuItem, Snackbar, SnackbarContent, Toolbar, Typography } from "@mui/material";
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from "@mui/system";
import React, { useContext, useState, useEffect, useRef } from "react";
import { db } from "db";
import { SnapshotContextType } from "types";
import { snapshotDetailsContext } from "components/SnapshotDetails";
import { AsyncImage } from "components/AsyncImage";
import {useLongPress, useScrollZone} from 'utils';

const uploadPath: string = 'https://uploader-api-eeoexn3tza-uc.a.run.app/snapshot';

function Home({setMode}: {setMode: (mode: number) => void}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadState, setUploadState] = useState<null|{success: boolean, count: number}>(null);
    const {setActiveSnapshot, allImages, loading} = useContext(snapshotDetailsContext) as SnapshotContextType;
    const [isLongClickTriggered, setIsLongClickTriggered] = useState(false);
    const [selectedStart, setSelectedStart] = useState<null | number>(null);
    const [selectedEnd, setSelectedEnd] = useState<null | number>(null);
    const [selectedSet, setSelectedSet] = useState<Set<number>>(new Set<number>());
    const scrollableRef: React.MutableRefObject<HTMLElement |null> = useRef(null);
    const {setShouldHandle} = useScrollZone(scrollableRef);
    useEffect(() => {
        if (document?.documentElement && document.documentElement !== scrollableRef.current) {
            scrollableRef.current = document.documentElement;
        }
    }, []);

    const currentTotal = allImages.reduce((p, c) => p + c.total!, 0);
    const menuOpen = Boolean(anchorEl);
    
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteAll = () => {
        db.snapshotRecords.clear();
        setAnchorEl(null);
    }

    // Way for people I trust to upload new images to train new models on. Accepting anyones images not only makes the bill higher,
    // but also potentially pollutes the data until there is validation in place.
    const handleUpload = async () => {
        if (allImages.length === 0) {
            return;
        }

        setAnchorEl(null);
        setUploading(true);
        setUploadState(null);
        try {
            const messages = allImages.map(img => {
                const {imageHeight, imageWidth, imageData, boundingBoxProps} = img;
                // format 'data:<mediatype>;base64,<imagedata>
                const [dataElement, base64Details] = imageData.split(';base64,');
                const mediaType = dataElement.split(':')[1];
                return JSON.stringify({
                    imageData: base64Details,
                    mediaType,
                    imageWidth,
                    imageHeight,
                    boundingBoxProps: boundingBoxProps.map(({
                      xmax, xmin, ymax, ymin, class: label, predictedLabel, score: predictionScore = 0   
                    }) => ({
                        xmax,
                        xmin,
                        ymax,
                        ymin,
                        label,
                        predictedLabel,
                        predictionScore
                    }))
                });
            });
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const responses = await Promise.all(messages.map(m => 
                fetch(uploadPath, {method: 'POST', body: m, headers: {'Authorization': `Bearer ${code}`, 'Content-Type': 'application/json'}})
            ));
            const failures = responses.filter(r => r.status > 299);
            if (failures.length > 0) {
                setUploadState({count: failures.length, success: false});
            } else {
                setUploadState({count: responses.length, success: true});
            }
        } finally {
            setUploading(false);
        }
    }

    const handleClickFab = () => {
        if (selectedSet.size > 0) {
            db.snapshotRecords.bulkDelete(Array.from(selectedSet).map(x => allImages[x].id!));
            setSelectedSet(new Set());
        } else {
            setMode(0);
        }
    }
    
    const onLongPress = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.currentTarget) {
            setIsLongClickTriggered(true);
            setSelectedStart(Number.parseInt(e.currentTarget.value));
            setSelectedEnd(Number.parseInt(e.currentTarget.value));
            document?.documentElement?.classList.add('no_scoll_overflow');
            setShouldHandle(true);
        }
    }

    const onTouchMove: React.TouchEventHandler<HTMLLIElement> = (e) => {
        if (!isLongClickTriggered) {
            return;
        }
        
        const { clientX, clientY } = e.touches.item(0);
        const targetElement = document.elementFromPoint(clientX, clientY)?.getAttribute('value');

        if (targetElement !== null && targetElement !== undefined) {
            const elementValue = Number.parseInt(targetElement);
            if (elementValue !== selectedEnd) {
                setSelectedEnd(elementValue);
            }
        }
    }

    const onLongPressEnd = () => {
        if (!isLongClickTriggered || selectedEnd === null || selectedStart === null) {
            return;
        }
        setIsLongClickTriggered(false);
        const min = Math.min(selectedStart, selectedEnd);
        const max = Math.max(selectedStart, selectedEnd) + 1;
        setSelectedSet(new Set<number>(
            Array.from<number, number>(Array(max-min).keys(), (e) => e + min))
        );
        document?.documentElement?.classList.remove('no_scoll_overflow');
        setShouldHandle(false);
    }

    const onTileClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const clickedTileIndex = Number.parseInt(e.currentTarget.value);
        if (selectedSet.size > 0) {
            if (selectedSet.has(clickedTileIndex)) {
                selectedSet.delete(clickedTileIndex);
            } else {
                selectedSet.add(clickedTileIndex);
            }
            setSelectedSet(new Set(selectedSet));
        } else {
            setActiveSnapshot(allImages[clickedTileIndex]);
            setMode(1);
        }
    }

    const longPressEvent = useLongPress(onLongPress, onLongPressEnd, onTileClick, onTouchMove, {
        shouldPreventDefault: true,
        delay: 500,
    });

    let selectedItems: Set<Number>;

    if (isLongClickTriggered && selectedStart !== null && selectedEnd !== null) {
        const min = Math.min(selectedStart, selectedEnd);
        const max = Math.max(selectedStart, selectedEnd) + 1;
        selectedItems = new Set<Number>(
            Array.from<number, number>(Array(max-min).keys(), (e) => e + min));
    } else {
        selectedItems = selectedSet || new Set<Number>();
    }
    const FabIcon = selectedItems.size > 0 ? DeleteForever : CameraEnhance;

    return (
        <>
        <Box sx={{minHeight: '100vh'}} bgcolor={colors.grey[100]}>
            <Typography variant="h5" gutterBottom component="div" sx={{ p: 2, pb: 0 }}>Current total: {currentTotal}</Typography>
            {loading && <LinearProgress />}
            <ImageList sx={{marginBottom: '56px'}} cols={2} rowHeight={164}>
                {allImages.map((item, i) => {
                    const scaledHeight = (item.imageHeight/item.imageWidth) * 164;
                    const shiftHeight = Math.floor(scaledHeight/2);
                    const hasBorder = selectedItems.has(i);

                    return (
                        <ImageListItem 
                            key={i}
                            sx={{ overflow: 'hidden', boxSizing: 'border-box', border: hasBorder ? 5 : 0, borderColor: colors.blue[500], transition: 'border-width 0.1s linear' }}
                            value={i}
                            {...longPressEvent}
                            >
                            <AsyncImage
                                loadingHeight='100%'
                                loadingWidth='100%'
                                src={item.imageData || ''}
                                srcSet={item.imageData || ''}
                                loading="lazy"
                                style={{ objectPosition: `0 -${shiftHeight}px`}} />
                            <ImageListItemBar
                                title={item.total}
                                className="no_touch_events"
                            />
                        </ImageListItem>
                    )
                })}
            </ImageList>
        </Box>
        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
            <Toolbar>
            <Fab color="primary" 
                onClick={handleClickFab}
                sx={{position: 'absolute', top: -30, left: 0, right: 0, margin: '0 auto'}}>
                <FabIcon />
            </Fab>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton color="inherit" onClick={handleMenuClick}>
                <MoreVert />
            </IconButton>
            </Toolbar>
        </AppBar>
        <Menu open={menuOpen} anchorEl={anchorEl} onClose={handleMenuClose}>
            <MenuItem onClick={handleUpload}>
                <CloudUpload sx={{pr:'8px'}} />
                Upload screenshots
            </MenuItem>
            <MenuItem component={Link} href="/rules">
                <MenuBook sx={{pr:'8px'}} />
                Rules
            </MenuItem>
            <MenuItem onClick={handleDeleteAll}>
                <DeleteForever sx={{pr:'8px'}} id="delete_forever" />
                Delete all
            </MenuItem>
        </Menu>
        <Snackbar open={uploading}>
            <SnackbarContent message="Uploading..." />
        </Snackbar>
        <Snackbar open={!uploading && uploadState !== null} autoHideDuration={5000} onClose={() => setUploadState(null)}>
            {uploadState?.success  
            ? <Alert severity="success" sx={{ width: '100%' }}>Successfully uploaded</Alert> 
            : <Alert severity="error" sx={{ width: '100%' }}>There was an error!</Alert>}
        </Snackbar>
        </>
    )
};

export default Home;