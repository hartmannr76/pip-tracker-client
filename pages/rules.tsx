import { Box } from "@mui/system";
import { ArrowBack } from "@mui/icons-material";
import { AppBar, Toolbar, colors, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Typography } from "@mui/material";
import { useState } from "react";

export default () => {
    enum Variation {
        MEXICAN_TRAIN,
        CHICKEN_FOOT
    };
    const playerCountArray: number[] = Array.from(Array(9).keys()).map(x => x+2);

    const [variation, setVariation] = useState<Variation>(Variation.MEXICAN_TRAIN);
    const [players, setPlayers] = useState<number>(2);

    // Up to 4 players take 15 dominoes each, 5 or 6 take 12 each, 7 or 8 take 10 each.
    const determineTileTakeCount = (): number|string => {

        if (variation === Variation.MEXICAN_TRAIN) {
            if (players > 0 && players <= 4) {
                return 15;
            } else if (players <= 6) {
                return 12;
            } else if (players <= 8) {
                return 10;
            }
    
            return 8;
        } else {
            if (players === 2) {
                return 21;
            } else if (players === 3) {
                return 14;
            } else if (players === 4) {
                return 10;
            } else if (players === 5) {
                return 8;
            }
            return 7;
        }
    }

    return (
        <>
        <Box sx={{minHeight: '100vh'}} bgcolor={colors.grey[100]}>
            <Paper>
            <Typography variant="h5" gutterBottom component="div" sx={{ p: 2, pb: 0 }}>Rules</Typography>
            <FormControl>
                <InputLabel id="game-variation-label">Variation</InputLabel>
                <Select
                    labelId="game-variation-label"
                    id="game-variation"
                    value={variation}
                    label="Game Variation"
                    onChange={(e) => setVariation(Number(e.target.value))}
                >
                    <MenuItem value={Variation.MEXICAN_TRAIN}>Mexican Train</MenuItem>
                    <MenuItem value={Variation.CHICKEN_FOOT}>Chicken Foot</MenuItem>
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id="player-count-labell">Players</InputLabel>
                <Select
                    labelId="player-count-label"
                    id="player-count"
                    value={players}
                    label="Player Count"
                    onChange={(e) => setPlayers(Number(e.target.value))}
                    sx={{width: '15ch'}}
                >
                    {playerCountArray.map(n => <MenuItem value={n}>{n}</MenuItem>)}
                </Select>
            </FormControl>
            <Typography variant="caption" gutterBottom component="p" sx={{ p: 2, pb: 0 }}><i>Note: </i>These rules are for a double-12 set.</Typography>
            <Typography variant="h6" gutterBottom component="div" sx={{ p: 2, pb: 0 }}>Setup</Typography>
            <Typography variant="body2" gutterBottom component="p" sx={{ p: 2, pb: 0 }}>Before each round, every player takes {determineTileTakeCount()} tiles.</Typography>
            <Typography variant="subtitle2" gutterBottom component="p" sx={{ p: 2, pb: 0 }}>More coming soon...</Typography>
            </Paper>
        </Box>
        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
        <Toolbar>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="home"
                sx={{ mr: 2 }}
                href="/"
            >
                <ArrowBack />
          </IconButton>
        </Toolbar>
        </AppBar>
        </>
    )
}