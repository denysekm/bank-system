import React from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    InputAdornment,
    Grid
} from "@mui/material";
import {
    Send as SendIcon,
    AccountBalance as AccountBalanceIcon,
    CompareArrows as CompareArrowsIcon,
    AttachMoney as AttachMoneyIcon,
    Notes as NotesIcon
} from "@mui/icons-material";

/**
 * Komponenta pro formulář bankovního převodu mezi účty (MUI verze).
 */
export default function TransferForm({ accTx, onAccTxChange, onSubmitAccTx }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 3, md: 5 },
                borderRadius: "24px",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                color: "#1e293b",
                maxWidth: "800px",
                margin: "4rem auto 0 auto",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(108, 71, 255, 0.1)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background: "radial-gradient(circle at 30% 30%, rgba(108, 71, 255, 0.03) 0%, transparent 50%)",
                    pointerEvents: "none",
                },
            }}
        >
            <Box sx={{ mb: 4, textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
                    Bankovní převod
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Převeďte své prostředky bezpečně a okamžitě.
                </Typography>
            </Box>

            <Box component="form" onSubmit={onSubmitAccTx} sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Z mého účtu"
                            name="fromAccount"
                            value={accTx.fromAccount}
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CompareArrowsIcon sx={{ color: "#6366f1" }} />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                            variant="outlined"
                            sx={textFieldStyle}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Na cílový účet"
                            name="toAccount"
                            value={accTx.toAccount}
                            onChange={(e) => onAccTxChange({ target: { name: "toAccount", value: e.target.value } })}
                            placeholder="Číslo účtu příjemce"
                            required
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccountBalanceIcon sx={{ color: "#6366f1" }} />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                            variant="outlined"
                            sx={textFieldStyle}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Částka"
                            type="number"
                            name="amount"
                            value={accTx.amount}
                            onChange={(e) => onAccTxChange({ target: { name: "amount", value: e.target.value } })}
                            placeholder="0.00"
                            required
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AttachMoneyIcon sx={{ color: "#6366f1" }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: <InputAdornment position="end">Kč</InputAdornment>
                                }
                            }}
                            variant="outlined"
                            sx={textFieldStyle}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Poznámka (volitelné)"
                            name="note"
                            value={accTx.note}
                            onChange={(e) => onAccTxChange({ target: { name: "note", value: e.target.value } })}
                            placeholder="např. splátka / nákup"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <NotesIcon sx={{ color: "#6366f1" }} />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                            variant="outlined"
                            sx={textFieldStyle}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
                    <Button
                        variant="contained"
                        type="submit"
                        size="large"
                        endIcon={<SendIcon />}
                        sx={{
                            px: 6,
                            py: 1.8,
                            borderRadius: "16px",
                            fontWeight: 700,
                            fontSize: "1rem",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #7477ff 0%, #5a52ff 100%)",
                                boxShadow: "0 15px 30px rgba(79, 70, 229, 0.4)",
                                transform: "translateY(-2px)",
                            },
                        }}
                    >
                        Provést platbu
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}

const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
        color: "#1e293b",
        bgcolor: "#f8fafc",
        borderRadius: "14px",
        "& fieldset": { borderColor: "#e2e8f0" },
        "&:hover fieldset": { borderColor: "#cbd5e1" },
        "&.Mui-focused fieldset": { borderColor: "#6366f1" },
    },
    "& .MuiInputLabel-root": { color: "#94a3b8" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
};
